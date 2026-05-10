#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  realpathSync,
} from "node:fs";
import { extname, parse as parsePath, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { inflateRawSync } from "node:zlib";

export const procedure = defineCliProcedure({
  id: "data-analysis-analyze",
  entry: procedureEntry(import.meta.url),
  description:
    "加载 CSV/XLSX 文件为内存表，支持 inspect 表结构、SQL 查询、统计汇总和导出为 CSV/JSON/MD。",
  owners: { skillIds: ["data-analysis"] },
  target: "scripts/analyze.mjs",
  runtime: "node",
  params: [
    {
      flag: "--files",
      type: "路径",
      description: "要加载的 CSV/XLSX 文件路径（支持多个）",
      required: true,
    },
    {
      flag: "--action",
      type: "inspect|query|summary",
      description:
        "执行动作：inspect 查看结构、query SQL 查询、summary 统计汇总",
      required: true,
    },
    {
      flag: "--sql",
      type: "字符串",
      description: "SQL 查询语句（action=query 时必填）",
      required: false,
    },
    {
      flag: "--table",
      type: "字符串",
      description: "目标表名（action=summary 时必填）",
      required: false,
    },
    {
      flag: "--output-file",
      type: "路径",
      description: "导出结果文件路径（仅 .csv/.json/.md）",
      required: false,
    },
    {
      flag: "--overwrite",
      type: "",
      description: "允许覆盖已存在的导出文件；仅在确认目标文件可替换后使用",
      required: false,
    },
  ],

  exampleArgs: { args: ["--files", "data.csv", "--action", "inspect"] },
});

function decodeEntities(value: any): any {
  const named: Record<string, any> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    quot: '"',
    nbsp: " ",
  };
  return String(value ?? "")
    .replace(/&#(\d+);/g, (_: any, code: any) =>
      String.fromCodePoint(Number(code)),
    )
    .replace(/&#x([0-9a-f]+);/gi, (_: any, code: any) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
    .replace(
      /&([a-z]+);/gi,
      (match: any, name: any) => named[name.toLowerCase()] ?? match,
    );
}
export function sanitizeIdentifier(name: any, prefix: any): any {
  let sanitized = String(name ?? "")
    .trim()
    .replace(/[^\w]+/g, "_")
    .replace(/^_+|_+$/g, "");
  if (!sanitized) sanitized = prefix;
  if (/^\d/.test(sanitized)) sanitized = `${prefix}_${sanitized}`;
  return sanitized;
}
export function dedupeIdentifiers(values: any, prefix: any): any {
  const seen = new Map();
  return values.map((value: any, index: any) => {
    const base = sanitizeIdentifier(value ?? "", `${prefix}_${index + 1}`);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  });
}
function createUniqueTableName(
  candidate: any,
  tableMap: any,
  prefix: any,
): any {
  const used = new Set(Object.values(tableMap));
  const original = sanitizeIdentifier(candidate, prefix);
  let tableName = original;
  let counter = 1;
  while (used.has(tableName)) {
    counter += 1;
    tableName = `${original}_${counter}`;
  }
  return tableName;
}
export function parseCsv(text: any): any {
  const rows: any[] = [];
  let row: any[] = [];
  let cell = "";
  let inQuotes = false;
  const source = String(text).replace(/^\uFEFF/, "");
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    const next = source[index + 1];
    if (inQuotes) {
      if (char === '"' && next === '"') {
        cell += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
      if (char === "\r" && next === "\n") index += 1;
    } else {
      cell += char;
    }
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((current: any) =>
    current.some((value: any) => String(value).trim() !== ""),
  );
}
function inferValue(raw: any): any {
  const value = String(raw ?? "").trim();
  if (value === "") return null;
  if (/^[+-]?\d+$/.test(value)) return Number.parseInt(value, 10);
  if (
    /^[+-]?(?:\d+\.\d*|\d*\.\d+)(?:e[+-]?\d+)?$/i.test(value) ||
    /^[+-]?\d+e[+-]?\d+$/i.test(value)
  ) {
    return Number.parseFloat(value);
  }
  if (/^(true|false)$/i.test(value)) return /^true$/i.test(value);
  return value;
}
function valueType(value: any): any {
  if (value == null) return null;
  if (typeof value === "number")
    return Number.isInteger(value) ? "BIGINT" : "DOUBLE";
  if (typeof value === "boolean") return "BOOLEAN";
  return "VARCHAR";
}
function mergeTypes(types: any): any {
  const filtered: any[] = [...new Set(types.filter(Boolean))];
  if (!filtered.length) return "VARCHAR";
  if (filtered.length === 1) return filtered[0];
  if (filtered.every((type: any) => type === "BIGINT" || type === "DOUBLE"))
    return "DOUBLE";
  return "VARCHAR";
}
function buildTable(originalName: any, tableName: any, rows: any): any {
  const headers = rows[0] ? dedupeIdentifiers(rows[0], "column") : [];
  const dataRows = rows.slice(1).map((row: any) => {
    const record: Record<string, any> = {};
    headers.forEach((header: any, index: any) => {
      record[header] = inferValue(row[index]);
    });
    return record;
  });
  const columns = headers.map((name: any) => ({
    name,
    type: mergeTypes(dataRows.map((row: any) => valueType(row[name]))),
    nullable: dataRows.some((row: any) => row[name] == null),
  }));
  return { originalName, name: tableName, columns, rows: dataRows };
}
function readUInt16(buffer: any, offset: any): any {
  return buffer.readUInt16LE(offset);
}
function readUInt32(buffer: any, offset: any): any {
  return buffer.readUInt32LE(offset);
}
function findEndOfCentralDirectory(buffer: any): any {
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (readUInt32(buffer, offset) === 0x06054b50) return offset;
  }
  throw new Error("Invalid XLSX zip: end of central directory not found");
}
function readZipEntries(buffer: any): any {
  const entries = new Map();
  const eocd = findEndOfCentralDirectory(buffer);
  const totalEntries = readUInt16(buffer, eocd + 10);
  let centralOffset = readUInt32(buffer, eocd + 16);
  for (let entryIndex = 0; entryIndex < totalEntries; entryIndex += 1) {
    if (readUInt32(buffer, centralOffset) !== 0x02014b50)
      throw new Error("Invalid XLSX zip: central directory entry");
    const compression = readUInt16(buffer, centralOffset + 10);
    const compressedSize = readUInt32(buffer, centralOffset + 20);
    const nameLength = readUInt16(buffer, centralOffset + 28);
    const extraLength = readUInt16(buffer, centralOffset + 30);
    const commentLength = readUInt16(buffer, centralOffset + 32);
    const localOffset = readUInt32(buffer, centralOffset + 42);
    const name = buffer.toString(
      "utf8",
      centralOffset + 46,
      centralOffset + 46 + nameLength,
    );
    if (readUInt32(buffer, localOffset) !== 0x04034b50)
      throw new Error("Invalid XLSX zip: local file header");
    const localNameLength = readUInt16(buffer, localOffset + 26);
    const localExtraLength = readUInt16(buffer, localOffset + 28);
    const dataOffset = localOffset + 30 + localNameLength + localExtraLength;
    const raw = buffer.subarray(dataOffset, dataOffset + compressedSize);
    if (compression === 0) entries.set(name, raw);
    else if (compression === 8) entries.set(name, inflateRawSync(raw));
    else throw new Error(`Unsupported XLSX compression method: ${compression}`);
    centralOffset += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}
function parseAttrs(attrs: any): any {
  const result: Record<string, any> = {};
  for (const match of String(attrs).matchAll(/([\w:.-]+)="([^"]*)"/g)) {
    result[match[1]] = decodeEntities(match[2]);
  }
  return result;
}
function parseSharedStrings(xml: any): any {
  if (!xml) return [];
  return [...xml.matchAll(/<si\b[\s\S]*?<\/si>/g)].map(([entry]: any) =>
    [...entry.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
      .map((match: any) => decodeEntities(match[1]))
      .join(""),
  );
}
function columnIndex(cellRef: any): any {
  const letters =
    String(cellRef || "")
      .match(/^[A-Z]+/i)?.[0]
      ?.toUpperCase() ?? "";
  let index = 0;
  for (const char of letters) index = index * 26 + (char.charCodeAt(0) - 64);
  return Math.max(0, index - 1);
}
function parseSheetRows(xml: any, sharedStrings: any): any {
  const rows: any[] = [];
  for (const rowMatch of String(xml).matchAll(
    /<row\b[^>]*>([\s\S]*?)<\/row>/g,
  )) {
    const row: any[] = [];
    for (const cellMatch of rowMatch[1].matchAll(
      /<c\b([^>]*)>([\s\S]*?)<\/c>/g,
    )) {
      const attrs = parseAttrs(cellMatch[1]);
      const index = columnIndex(attrs.r || `A${row.length + 1}`);
      let value = "";
      if (attrs.t === "inlineStr") {
        value = [...cellMatch[2].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)]
          .map((match: any) => decodeEntities(match[1]))
          .join("");
      } else {
        value = decodeEntities(
          cellMatch[2].match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1] ?? "",
        );
        if (attrs.t === "s")
          value = sharedStrings[Number.parseInt(value, 10)] ?? "";
        if (attrs.t === "b") value = value === "1" ? "true" : "false";
      }
      while (row.length < index) row.push("");
      row[index] = value;
    }
    if (row.some((value: any) => String(value ?? "").trim() !== ""))
      rows.push(row);
  }
  return rows;
}
function loadXlsx(filePath: any, tableMap: any, tables: any): any {
  const entries = readZipEntries(readFileSync(filePath));
  const workbook = entries.get("xl/workbook.xml")?.toString("utf8");
  const rels = entries.get("xl/_rels/workbook.xml.rels")?.toString("utf8");
  if (!workbook || !rels)
    throw new Error("Invalid XLSX: missing workbook metadata");
  const relationships: Record<string, any> = {};
  for (const match of rels.matchAll(/<Relationship\b([^>]*)\/>/g)) {
    const attrs = parseAttrs(match[1]);
    relationships[attrs.Id] = attrs.Target?.startsWith("/")
      ? attrs.Target.slice(1)
      : `xl/${attrs.Target}`;
  }
  const sharedStrings = parseSharedStrings(
    entries.get("xl/sharedStrings.xml")?.toString("utf8"),
  );
  for (const match of workbook.matchAll(/<sheet\b([^>]*)\/>/g)) {
    const attrs = parseAttrs(match[1]);
    const sheetName = attrs.name || "Sheet";
    const target = relationships[attrs["r:id"]];
    if (!target || !entries.has(target)) continue;
    const rows = parseSheetRows(
      entries.get(target).toString("utf8"),
      sharedStrings,
    );
    if (!rows.length) continue;
    const tableName = createUniqueTableName(sheetName, tableMap, "table");
    tableMap[sheetName] = tableName;
    tables.set(tableName, buildTable(sheetName, tableName, rows));
    console.error(
      `  Loaded sheet '${sheetName}' -> table '${tableName}' (${rows.length - 1} rows)`,
    );
  }
}
function loadCsv(filePath: any, tableMap: any, tables: any): any {
  const tableKey = parsePath(filePath).name;
  const tableName = createUniqueTableName(tableKey, tableMap, "table");
  const rows = parseCsv(readFileSync(filePath, "utf8"));
  if (!rows.length) throw new Error(`CSV has no rows: ${filePath}`);
  tableMap[tableKey] = tableName;
  const table = buildTable(tableKey, tableName, rows);
  tables.set(tableName, table);
  console.error(
    `  Loaded CSV '${tableKey}' -> table '${tableName}' (${table.rows.length} rows)`,
  );
}
export function loadFiles(files: any): any {
  const tableMap: Record<string, any> = {};
  const tables = new Map();
  for (const filePath of files) {
    if (!existsSync(filePath)) {
      console.error(`File not found: ${filePath}`);
      continue;
    }
    const ext = extname(filePath).toLowerCase();
    try {
      if (ext === ".csv") loadCsv(filePath, tableMap, tables);
      else if (ext === ".xlsx") loadXlsx(filePath, tableMap, tables);
      else if (ext === ".xls")
        console.error(`Legacy .xls is not supported directly: ${filePath}`);
      else console.error(`Unsupported file format: ${ext} (${filePath})`);
    } catch (error: any) {
      console.error(`  Failed to load '${filePath}': ${error.message}`);
    }
  }
  return { tableMap, tables };
}
function formatValue(value: any): any {
  if (value == null) return "";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return String(value);
}
function formatRows(columns: any, rows: any): any {
  if (!rows.length) return "  <no rows>";
  const widths = columns.map((column: any) =>
    Math.min(40, String(column).length),
  );
  for (const row of rows) {
    columns.forEach((column: any, index: any) => {
      widths[index] = Math.min(
        40,
        Math.max(widths[index], formatValue(row[column]).length),
      );
    });
  }
  const header = columns
    .map((column: any, index: any) => String(column).padEnd(widths[index]))
    .join(" | ");
  const separator = widths.map((width: any) => "-".repeat(width)).join("-+-");
  const body = rows.map((row: any) =>
    columns
      .map((column: any, index: any) =>
        formatValue(row[column]).slice(0, widths[index]).padEnd(widths[index]),
      )
      .join(" | "),
  );
  return [header, separator, ...body].join("\n");
}
export function actionInspect({ tableMap, tables }: any): any {
  const output: any[] = [];
  for (const [originalName, tableName] of Object.entries(tableMap)) {
    const table = tables.get(tableName);
    output.push(`\n${"=".repeat(60)}`);
    output.push(`Table: ${originalName} (SQL name: "${tableName}")`);
    output.push("=".repeat(60));
    output.push(`Rows: ${table.rows.length}`);
    output.push(`\nColumns (${table.columns.length}):`);
    output.push(`${"Name".padEnd(30)} ${"Type".padEnd(15)} Nullable`);
    output.push(`${"-".repeat(30)} ${"-".repeat(15)} ${"-".repeat(8)}`);
    for (const column of table.columns) {
      output.push(
        `${column.name.padEnd(30)} ${column.type.padEnd(15)} ${column.nullable ? "YES" : "NO"}`,
      );
    }
    output.push("\nNon-null counts:");
    for (const column of table.columns) {
      const count = table.rows.filter(
        (row: any) => row[column.name] != null,
      ).length;
      output.push(`  ${column.name}: ${count} / ${table.rows.length}`);
    }
    output.push("\nSample data (first 5 rows):");
    output.push(
      formatRows(
        table.columns.map((column: any) => column.name),
        table.rows.slice(0, 5),
      ),
    );
  }
  const result = output.join("\n");
  console.log(result);
  return result;
}
function splitComma(value: any): any {
  const parts: any[] = [];
  let current = "";
  let depth = 0;
  let quote = "";
  for (const char of value) {
    if (quote) {
      current += char;
      if (char === quote) quote = "";
    } else if (char === '"' || char === "'") {
      quote = char;
      current += char;
    } else if (char === "(") {
      depth += 1;
      current += char;
    } else if (char === ")") {
      depth -= 1;
      current += char;
    } else if (char === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}
function unquoteIdentifier(value: any): any {
  const trimmed = String(value ?? "").trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("`") && trimmed.endsWith("`"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}
function parseLiteral(value: any): any {
  const trimmed = String(value ?? "").trim();
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  if (/^[+-]?\d+(?:\.\d+)?$/i.test(trimmed)) return Number(trimmed);
  if (/^(true|false)$/i.test(trimmed)) return /^true$/i.test(trimmed);
  return trimmed;
}
function resolveColumn(row: any, column: any): any {
  const name = unquoteIdentifier(column);
  if (Object.hasOwn(row, name)) return row[name];
  const key = Object.keys(row).find(
    (candidate: any) => candidate.toLowerCase() === name.toLowerCase(),
  );
  return key ? row[key] : undefined;
}
function parseSelectExpression(rawExpression: any): any {
  const aliasMatch = rawExpression.match(
    /^([\s\S]+?)\s+AS\s+("[^"]+"|`[^`]+`|[\w-]+)$/i,
  );
  const expression = aliasMatch ? aliasMatch[1].trim() : rawExpression.trim();
  const alias = aliasMatch ? unquoteIdentifier(aliasMatch[2]) : null;
  if (expression === "*") return { kind: "star", alias: "*" };
  const aggregate = expression.match(
    /^(SUM|AVG|COUNT|MIN|MAX)\s*\(([\s\S]+)\)$/i,
  );
  if (aggregate) {
    const fn = aggregate[1].toUpperCase();
    const column =
      aggregate[2].trim() === "*" ? "*" : unquoteIdentifier(aggregate[2]);
    return {
      kind: "aggregate",
      fn,
      column,
      alias: alias ?? `${fn.toLowerCase()}_${column === "*" ? "all" : column}`,
    };
  }
  const column = unquoteIdentifier(expression);
  return { kind: "column", column, alias: alias ?? column };
}
function parseSql(sql: any): any {
  let source = String(sql ?? "")
    .trim()
    .replace(/;$/, "");
  const limitMatch = source.match(/\s+LIMIT\s+(\d+)\s*$/i);
  const limit = limitMatch ? Number.parseInt(limitMatch[1], 10) : null;
  if (limitMatch) source = source.slice(0, limitMatch.index).trim();
  const orderMatch = source.match(
    /\s+ORDER\s+BY\s+(.+?)(?:\s+(ASC|DESC))?\s*$/i,
  );
  const orderBy = orderMatch
    ? {
        column: unquoteIdentifier(orderMatch[1]),
        desc: /^DESC$/i.test(orderMatch[2] || ""),
      }
    : null;
  if (orderMatch) source = source.slice(0, orderMatch.index).trim();
  const groupMatch = source.match(/\s+GROUP\s+BY\s+(.+?)\s*$/i);
  const groupBy = groupMatch
    ? splitComma(groupMatch[1]).map(unquoteIdentifier)
    : [];
  if (groupMatch) source = source.slice(0, groupMatch.index).trim();
  const whereMatch = source.match(/\s+WHERE\s+(.+?)\s*$/i);
  const where = whereMatch ? whereMatch[1].trim() : "";
  if (whereMatch) source = source.slice(0, whereMatch.index).trim();
  const selectMatch = source.match(
    /^SELECT\s+([\s\S]+?)\s+FROM\s+("[^"]+"|`[^`]+`|[\w-]+)$/i,
  );
  if (!selectMatch)
    throw new Error("Only SELECT ... FROM <table> queries are supported");
  return {
    expressions: splitComma(selectMatch[1]).map(parseSelectExpression),
    table: unquoteIdentifier(selectMatch[2]),
    where,
    groupBy,
    orderBy,
    limit,
  };
}
function compareValues(left: any, operator: any, right: any): any {
  if (operator.toUpperCase() === "LIKE") {
    const pattern = String(right)
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/%/g, ".*");
    return new RegExp(`^${pattern}$`, "i").test(String(left ?? ""));
  }
  if (operator === "=") return left === right || String(left) === String(right);
  if (operator === "!=" || operator === "<>")
    return !(left === right || String(left) === String(right));
  const leftNumber = Number(left);
  const rightNumber = Number(right);
  const a = Number.isNaN(leftNumber) ? String(left) : leftNumber;
  const b = Number.isNaN(rightNumber) ? String(right) : rightNumber;
  if (operator === ">") return a > b;
  if (operator === ">=") return a >= b;
  if (operator === "<") return a < b;
  if (operator === "<=") return a <= b;
  return false;
}
function filterRows(rows: any, where: any): any {
  if (!where) return rows;
  const conditions = where
    .split(/\s+AND\s+/i)
    .map((part: any) => part.trim())
    .filter(Boolean);
  return rows.filter((row: any) =>
    conditions.every((condition: any) => {
      const match = condition.match(
        /^("[^"]+"|`[^`]+`|[\w-]+)\s*(=|!=|<>|>=|<=|>|<|LIKE)\s*([\s\S]+)$/i,
      );
      if (!match) throw new Error(`Unsupported WHERE condition: ${condition}`);
      return compareValues(
        resolveColumn(row, match[1]),
        match[2],
        parseLiteral(match[3]),
      );
    }),
  );
}
function aggregateValue(rows: any, expression: any): any {
  const values =
    expression.column === "*"
      ? rows
      : rows
          .map((row: any) => resolveColumn(row, expression.column))
          .filter((value: any) => value != null);
  if (expression.fn === "COUNT") return values.length;
  const numeric = values
    .map(Number)
    .filter((value: any) => Number.isFinite(value));
  if (expression.fn === "SUM")
    return numeric.reduce((sum: any, value: any) => sum + value, 0);
  if (expression.fn === "AVG")
    return numeric.length
      ? numeric.reduce((sum: any, value: any) => sum + value, 0) /
          numeric.length
      : null;
  if (expression.fn === "MIN")
    return numeric.length ? Math.min(...numeric) : null;
  if (expression.fn === "MAX")
    return numeric.length ? Math.max(...numeric) : null;
  return null;
}
function projectRows(rows: any, expressions: any): any {
  if (expressions.length === 1 && expressions[0].kind === "star")
    return rows.map((row: any) => ({ ...row }));
  return rows.map((row: any) => {
    const projected: Record<string, any> = {};
    for (const expression of expressions) {
      if (expression.kind === "column")
        projected[expression.alias] = resolveColumn(row, expression.column);
      else if (expression.kind === "aggregate")
        projected[expression.alias] = aggregateValue([row], expression);
      else Object.assign(projected, row);
    }
    return projected;
  });
}
function groupRows(rows: any, groupBy: any, expressions: any): any {
  const groups = new Map();
  for (const row of rows) {
    const key = JSON.stringify(
      groupBy.map((column: any) => resolveColumn(row, column)),
    );
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.values()].map((group: any) => {
    const output: Record<string, any> = {};
    for (const column of groupBy)
      output[column] = resolveColumn(group[0], column);
    for (const expression of expressions) {
      if (expression.kind === "aggregate")
        output[expression.alias] = aggregateValue(group, expression);
      else if (
        expression.kind === "column" &&
        !Object.hasOwn(output, expression.alias)
      ) {
        output[expression.alias] = resolveColumn(group[0], expression.column);
      }
    }
    return output;
  });
}
function sortRows(rows: any, orderBy: any): any {
  if (!orderBy) return rows;
  return [...rows].sort((left: any, right: any) => {
    const a = resolveColumn(left, orderBy.column);
    const b = resolveColumn(right, orderBy.column);
    if (a === b) return 0;
    const result = a > b ? 1 : -1;
    return orderBy.desc ? -result : result;
  });
}
function resolveTable(parsed: any, context: any): any {
  const tableName = context.tableMap[parsed.table] ?? parsed.table;
  const table = context.tables.get(tableName);
  if (!table) {
    const available = Object.entries(context.tableMap)
      .map(([original, name]: any) => `"${name}" (${original})`)
      .join(", ");
    throw new Error(
      `Table '${parsed.table}' not found. Available tables: ${available}`,
    );
  }
  return table;
}
export function runQuery(sql: any, context: any): any {
  const parsed = parseSql(sql);
  const table = resolveTable(parsed, context);
  const rows = filterRows(table.rows, parsed.where);
  const hasAggregate = parsed.expressions.some(
    (expression: any) => expression.kind === "aggregate",
  );
  let resultRows =
    hasAggregate || parsed.groupBy.length
      ? groupRows(rows, parsed.groupBy, parsed.expressions)
      : projectRows(rows, parsed.expressions);
  resultRows = sortRows(resultRows, parsed.orderBy);
  if (parsed.limit != null) resultRows = resultRows.slice(0, parsed.limit);
  return resultRows;
}
function rowsToColumns(rows: any): any {
  const columns: any[] = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!columns.includes(key)) columns.push(key);
    }
  }
  return columns;
}
function csvEscape(value: any): any {
  const text = formatValue(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}
export function exportResults(rows: any, outputFile: any, overwrite: any = false): any {
  const columns = rowsToColumns(rows);
  const target = resolve(outputFile);
  const ext = extname(target).toLowerCase();
  if (![".csv", ".json", ".md"].includes(ext)) {
    throw new Error(
      `Unsupported output format: ${ext}. Use .csv, .json, or .md`,
    );
  }
  if (existsSync(target) && !overwrite) {
    throw new Error(
      `output file already exists: ${target}; pass --overwrite only after confirming it can be replaced`,
    );
  }
  mkdirSync(resolve(target, ".."), { recursive: true });
  if (ext === ".csv") {
    writeFileSync(
      target,
      [
        columns,
        ...rows.map((row: any) => columns.map((column: any) => row[column])),
      ]
        .map((row: any) => row.map(csvEscape).join(","))
        .join("\n") + "\n",
      "utf8",
    );
  } else if (ext === ".json") {
    writeFileSync(target, JSON.stringify(rows, null, 2), "utf8");
  } else if (ext === ".md") {
    const lines: any[] = [
      `| ${columns.join(" | ")} |`,
      `| ${columns.map(() => "---").join(" | ")} |`,
      ...rows.map(
        (row: any) =>
          `| ${columns.map((column: any) => formatValue(row[column]).replaceAll("|", "\\|")).join(" | ")} |`,
      ),
    ];
    writeFileSync(target, lines.join("\n") + "\n", "utf8");
  }
  return `Results exported to ${target} (${rows.length} rows)`;
}
export function actionQuery(
  context: any,
  sql: any,
  outputFile: any = null,
  overwrite: any = false,
): any {
  try {
    const rows = runQuery(sql, context);
    if (outputFile) {
      const message = exportResults(rows, outputFile, overwrite);
      console.log(message);
      return message;
    }
    const columns = rowsToColumns(rows);
    const result = rows.length
      ? `${formatRows(columns, rows)}\n\n(${rows.length} rows)`
      : "Query returned 0 rows.";
    console.log(result);
    return result;
  } catch (error: any) {
    const message: any[] = [
      `SQL Error: ${error.message}`,
      "",
      "Available tables:",
    ];
    for (const [originalName, tableName] of Object.entries(context.tableMap)) {
      const table = context.tables.get(tableName);
      message.push(
        `  "${tableName}" (${originalName}): ${table.columns.map((column: any) => column.name).join(", ")}`,
      );
    }
    const result = message.join("\n");
    console.log(result);
    return result;
  }
}
function quantile(sortedValues: any, q: any): any {
  if (!sortedValues.length) return null;
  const position = (sortedValues.length - 1) * q;
  const base = Math.floor(position);
  const rest = position - base;
  if (sortedValues[base + 1] == null) return sortedValues[base];
  return (
    sortedValues[base] + rest * (sortedValues[base + 1] - sortedValues[base])
  );
}
export function actionSummary(context: any, tableName: any): any {
  const resolvedName = context.tableMap[tableName] ?? tableName;
  const table = context.tables.get(resolvedName);
  if (!table) {
    const available = Object.entries(context.tableMap)
      .map(([original, name]: any) => `"${name}" (${original})`)
      .join(", ");
    const message = `Table '${tableName}' not found. Available tables: ${available}`;
    console.log(message);
    return message;
  }
  const output: any[] = [
    `\nStatistical Summary: ${tableName}`,
    `Total rows: ${table.rows.length}`,
    "=".repeat(70),
  ];
  for (const column of table.columns) {
    const values = table.rows
      .map((row: any) => row[column.name])
      .filter((value: any) => value != null);
    output.push(`\n--- ${column.name} (${column.type}) ---`);
    if (column.type === "BIGINT" || column.type === "DOUBLE") {
      const numeric = values
        .map(Number)
        .filter((value: any) => Number.isFinite(value))
        .sort((a: any, b: any) => a - b);
      const mean = numeric.length
        ? numeric.reduce((sum: any, value: any) => sum + value, 0) /
          numeric.length
        : null;
      const variance =
        numeric.length > 1
          ? numeric.reduce(
              (sum: any, value: any) => sum + (value - (mean as number)) ** 2,
              0,
            ) /
            (numeric.length - 1)
          : null;
      const stats: Record<string, any> = {
        count: numeric.length,
        mean,
        std: variance == null ? null : Math.sqrt(variance),
        min: numeric[0] ?? null,
        "25%": quantile(numeric, 0.25),
        "50%": quantile(numeric, 0.5),
        "75%": quantile(numeric, 0.75),
        max: numeric[numeric.length - 1] ?? null,
        nulls: table.rows.length - numeric.length,
      };
      for (const [label, value] of Object.entries(stats)) {
        output.push(
          `  ${label.padEnd(8)}: ${typeof value === "number" ? Number(value.toFixed(4)) : value}`,
        );
      }
    } else {
      const counts = new Map();
      for (const value of values)
        counts.set(String(value), (counts.get(String(value)) ?? 0) + 1);
      const topValues = [...counts.entries()]
        .sort((left: any, right: any) => right[1] - left[1])
        .slice(0, 5);
      output.push(`  count   : ${values.length}`);
      output.push(`  unique  : ${counts.size}`);
      output.push(`  top     : ${topValues[0]?.[0] ?? ""}`);
      output.push(`  nulls   : ${table.rows.length - values.length}`);
      if (topValues.length) {
        output.push("  top values:");
        for (const [value, frequency] of topValues) {
          const percentage = table.rows.length
            ? ((frequency / table.rows.length) * 100).toFixed(1)
            : "0.0";
          output.push(`    ${value}: ${frequency} (${percentage}%)`);
        }
      }
    }
  }
  const result = output.join("\n");
  console.log(result);
  return result;
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    files: [],
    action: null,
    sql: null,
    table: null,
    outputFile: null,
    overwrite: false,
  };
  const readOptionValue = (index: number, flag: string): string => {
    const value = argv[index + 1];
    if (value == null || value.startsWith("--")) {
      throw new Error(`${flag} requires a value`);
    }
    return value;
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--files") {
      const start = args.files.length;
      while (argv[index + 1] && !argv[index + 1].startsWith("--")) {
        args.files.push(argv[index + 1]);
        index += 1;
      }
      if (args.files.length === start) {
        throw new Error("--files requires a value");
      }
    } else if (arg === "--action") {
      args.action = readOptionValue(index, arg);
      index += 1;
    } else if (arg === "--sql") {
      args.sql = readOptionValue(index, arg);
      index += 1;
    } else if (arg === "--table") {
      args.table = readOptionValue(index, arg);
      index += 1;
    } else if (arg === "--output-file") {
      args.outputFile = readOptionValue(index, arg);
      index += 1;
    } else if (arg === "--overwrite") {
      args.overwrite = true;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!args.files.length) throw new Error("--files is required");
  if (!["inspect", "query", "summary"].includes(args.action))
    throw new Error("--action must be inspect, query, or summary");
  if (args.action === "query" && !args.sql)
    throw new Error("--sql is required for 'query' action");
  if (args.action === "summary" && !args.table)
    throw new Error("--table is required for 'summary' action");
  return args;
}
export function main(argv: readonly string[]): any {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error: any) {
    console.error(
      `${error.message}\nUsage: node scripts/analyze.mjs --files <file...> --action inspect|query|summary [--sql SQL] [--table TABLE] [--output-file PATH] [--overwrite]`,
    );
    return 1;
  }
  console.error("Loading files...");
  const context = loadFiles(args.files);
  if (!context.tables.size) {
    console.error("No tables were loaded. Check file paths and formats.");
    return 1;
  }
  console.error(
    `\nLoaded ${context.tables.size} table(s): ${Object.keys(context.tableMap).join(", ")}`,
  );
  if (args.action === "inspect") actionInspect(context);
  else if (args.action === "query")
    actionQuery(context, args.sql, args.outputFile, args.overwrite);
  else actionSummary(context, args.table);
  return 0;
}
