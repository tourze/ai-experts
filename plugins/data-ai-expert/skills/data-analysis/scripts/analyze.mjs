#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { extname, parse as parsePath, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { inflateRawSync } from "node:zlib";

function decodeEntities(value) {
  const named = { amp: "&", apos: "'", gt: ">", lt: "<", quot: '"', nbsp: " " };
  return String(value ?? "")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&([a-z]+);/gi, (match, name) => named[name.toLowerCase()] ?? match);
}

export function sanitizeIdentifier(name, prefix) {
  let sanitized = String(name ?? "").trim().replace(/[^\w]+/g, "_").replace(/^_+|_+$/g, "");
  if (!sanitized) sanitized = prefix;
  if (/^\d/.test(sanitized)) sanitized = `${prefix}_${sanitized}`;
  return sanitized;
}

export function dedupeIdentifiers(values, prefix) {
  const seen = new Map();
  return values.map((value, index) => {
    const base = sanitizeIdentifier(value ?? "", `${prefix}_${index + 1}`);
    const count = seen.get(base) ?? 0;
    seen.set(base, count + 1);
    return count === 0 ? base : `${base}_${count + 1}`;
  });
}

function createUniqueTableName(candidate, tableMap, prefix) {
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

export function parseCsv(text) {
  const rows = [];
  let row = [];
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
  return rows.filter((current) => current.some((value) => String(value).trim() !== ""));
}

function inferValue(raw) {
  const value = String(raw ?? "").trim();
  if (value === "") return null;
  if (/^[+-]?\d+$/.test(value)) return Number.parseInt(value, 10);
  if (/^[+-]?(?:\d+\.\d*|\d*\.\d+)(?:e[+-]?\d+)?$/i.test(value) || /^[+-]?\d+e[+-]?\d+$/i.test(value)) {
    return Number.parseFloat(value);
  }
  if (/^(true|false)$/i.test(value)) return /^true$/i.test(value);
  return value;
}

function valueType(value) {
  if (value == null) return null;
  if (typeof value === "number") return Number.isInteger(value) ? "BIGINT" : "DOUBLE";
  if (typeof value === "boolean") return "BOOLEAN";
  return "VARCHAR";
}

function mergeTypes(types) {
  const filtered = [...new Set(types.filter(Boolean))];
  if (!filtered.length) return "VARCHAR";
  if (filtered.length === 1) return filtered[0];
  if (filtered.every((type) => type === "BIGINT" || type === "DOUBLE")) return "DOUBLE";
  return "VARCHAR";
}

function buildTable(originalName, tableName, rows) {
  const headers = rows[0] ? dedupeIdentifiers(rows[0], "column") : [];
  const dataRows = rows.slice(1).map((row) => {
    const record = {};
    headers.forEach((header, index) => {
      record[header] = inferValue(row[index]);
    });
    return record;
  });
  const columns = headers.map((name) => ({
    name,
    type: mergeTypes(dataRows.map((row) => valueType(row[name]))),
    nullable: dataRows.some((row) => row[name] == null),
  }));
  return { originalName, name: tableName, columns, rows: dataRows };
}

function readUInt16(buffer, offset) {
  return buffer.readUInt16LE(offset);
}

function readUInt32(buffer, offset) {
  return buffer.readUInt32LE(offset);
}

function findEndOfCentralDirectory(buffer) {
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (readUInt32(buffer, offset) === 0x06054b50) return offset;
  }
  throw new Error("Invalid XLSX zip: end of central directory not found");
}

function readZipEntries(buffer) {
  const entries = new Map();
  const eocd = findEndOfCentralDirectory(buffer);
  const totalEntries = readUInt16(buffer, eocd + 10);
  let centralOffset = readUInt32(buffer, eocd + 16);

  for (let entryIndex = 0; entryIndex < totalEntries; entryIndex += 1) {
    if (readUInt32(buffer, centralOffset) !== 0x02014b50) throw new Error("Invalid XLSX zip: central directory entry");
    const compression = readUInt16(buffer, centralOffset + 10);
    const compressedSize = readUInt32(buffer, centralOffset + 20);
    const nameLength = readUInt16(buffer, centralOffset + 28);
    const extraLength = readUInt16(buffer, centralOffset + 30);
    const commentLength = readUInt16(buffer, centralOffset + 32);
    const localOffset = readUInt32(buffer, centralOffset + 42);
    const name = buffer.toString("utf8", centralOffset + 46, centralOffset + 46 + nameLength);

    if (readUInt32(buffer, localOffset) !== 0x04034b50) throw new Error("Invalid XLSX zip: local file header");
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

function parseAttrs(attrs) {
  const result = {};
  for (const match of String(attrs).matchAll(/([\w:.-]+)="([^"]*)"/g)) {
    result[match[1]] = decodeEntities(match[2]);
  }
  return result;
}

function parseSharedStrings(xml) {
  if (!xml) return [];
  return [...xml.matchAll(/<si\b[\s\S]*?<\/si>/g)].map(([entry]) =>
    [...entry.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((match) => decodeEntities(match[1])).join("")
  );
}

function columnIndex(cellRef) {
  const letters = String(cellRef || "").match(/^[A-Z]+/i)?.[0]?.toUpperCase() ?? "";
  let index = 0;
  for (const char of letters) index = index * 26 + (char.charCodeAt(0) - 64);
  return Math.max(0, index - 1);
}

function parseSheetRows(xml, sharedStrings) {
  const rows = [];
  for (const rowMatch of String(xml).matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g)) {
    const row = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = parseAttrs(cellMatch[1]);
      const index = columnIndex(attrs.r || `A${row.length + 1}`);
      let value = "";
      if (attrs.t === "inlineStr") {
        value = [...cellMatch[2].matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>/g)].map((match) => decodeEntities(match[1])).join("");
      } else {
        value = decodeEntities(cellMatch[2].match(/<v\b[^>]*>([\s\S]*?)<\/v>/)?.[1] ?? "");
        if (attrs.t === "s") value = sharedStrings[Number.parseInt(value, 10)] ?? "";
        if (attrs.t === "b") value = value === "1" ? "true" : "false";
      }
      while (row.length < index) row.push("");
      row[index] = value;
    }
    if (row.some((value) => String(value ?? "").trim() !== "")) rows.push(row);
  }
  return rows;
}

function loadXlsx(filePath, tableMap, tables) {
  const entries = readZipEntries(readFileSync(filePath));
  const workbook = entries.get("xl/workbook.xml")?.toString("utf8");
  const rels = entries.get("xl/_rels/workbook.xml.rels")?.toString("utf8");
  if (!workbook || !rels) throw new Error("Invalid XLSX: missing workbook metadata");

  const relationships = {};
  for (const match of rels.matchAll(/<Relationship\b([^>]*)\/>/g)) {
    const attrs = parseAttrs(match[1]);
    relationships[attrs.Id] = attrs.Target?.startsWith("/") ? attrs.Target.slice(1) : `xl/${attrs.Target}`;
  }
  const sharedStrings = parseSharedStrings(entries.get("xl/sharedStrings.xml")?.toString("utf8"));

  for (const match of workbook.matchAll(/<sheet\b([^>]*)\/>/g)) {
    const attrs = parseAttrs(match[1]);
    const sheetName = attrs.name || "Sheet";
    const target = relationships[attrs["r:id"]];
    if (!target || !entries.has(target)) continue;
    const rows = parseSheetRows(entries.get(target).toString("utf8"), sharedStrings);
    if (!rows.length) continue;
    const tableName = createUniqueTableName(sheetName, tableMap, "table");
    tableMap[sheetName] = tableName;
    tables.set(tableName, buildTable(sheetName, tableName, rows));
    console.error(`  Loaded sheet '${sheetName}' -> table '${tableName}' (${rows.length - 1} rows)`);
  }
}

function loadCsv(filePath, tableMap, tables) {
  const tableKey = parsePath(filePath).name;
  const tableName = createUniqueTableName(tableKey, tableMap, "table");
  const rows = parseCsv(readFileSync(filePath, "utf8"));
  if (!rows.length) throw new Error(`CSV has no rows: ${filePath}`);
  tableMap[tableKey] = tableName;
  const table = buildTable(tableKey, tableName, rows);
  tables.set(tableName, table);
  console.error(`  Loaded CSV '${tableKey}' -> table '${tableName}' (${table.rows.length} rows)`);
}

export function loadFiles(files) {
  const tableMap = {};
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
      else if (ext === ".xls") console.error(`Legacy .xls is not supported directly: ${filePath}`);
      else console.error(`Unsupported file format: ${ext} (${filePath})`);
    } catch (error) {
      console.error(`  Failed to load '${filePath}': ${error.message}`);
    }
  }
  return { tableMap, tables };
}

function formatValue(value) {
  if (value == null) return "";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return String(value);
}

function formatRows(columns, rows) {
  if (!rows.length) return "  <no rows>";
  const widths = columns.map((column) => Math.min(40, String(column).length));
  for (const row of rows) {
    columns.forEach((column, index) => {
      widths[index] = Math.min(40, Math.max(widths[index], formatValue(row[column]).length));
    });
  }
  const header = columns.map((column, index) => String(column).padEnd(widths[index])).join(" | ");
  const separator = widths.map((width) => "-".repeat(width)).join("-+-");
  const body = rows.map((row) =>
    columns.map((column, index) => formatValue(row[column]).slice(0, widths[index]).padEnd(widths[index])).join(" | ")
  );
  return [header, separator, ...body].join("\n");
}

export function actionInspect({ tableMap, tables }) {
  const output = [];
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
      output.push(`${column.name.padEnd(30)} ${column.type.padEnd(15)} ${column.nullable ? "YES" : "NO"}`);
    }
    output.push("\nNon-null counts:");
    for (const column of table.columns) {
      const count = table.rows.filter((row) => row[column.name] != null).length;
      output.push(`  ${column.name}: ${count} / ${table.rows.length}`);
    }
    output.push("\nSample data (first 5 rows):");
    output.push(formatRows(table.columns.map((column) => column.name), table.rows.slice(0, 5)));
  }
  const result = output.join("\n");
  console.log(result);
  return result;
}

function splitComma(value) {
  const parts = [];
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

function unquoteIdentifier(value) {
  const trimmed = String(value ?? "").trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("`") && trimmed.endsWith("`"))) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseLiteral(value) {
  const trimmed = String(value ?? "").trim();
  if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }
  if (/^[+-]?\d+(?:\.\d+)?$/i.test(trimmed)) return Number(trimmed);
  if (/^(true|false)$/i.test(trimmed)) return /^true$/i.test(trimmed);
  return trimmed;
}

function resolveColumn(row, column) {
  const name = unquoteIdentifier(column);
  if (Object.hasOwn(row, name)) return row[name];
  const key = Object.keys(row).find((candidate) => candidate.toLowerCase() === name.toLowerCase());
  return key ? row[key] : undefined;
}

function parseSelectExpression(rawExpression) {
  const aliasMatch = rawExpression.match(/^([\s\S]+?)\s+AS\s+("[^"]+"|`[^`]+`|[\w-]+)$/i);
  const expression = aliasMatch ? aliasMatch[1].trim() : rawExpression.trim();
  const alias = aliasMatch ? unquoteIdentifier(aliasMatch[2]) : null;
  if (expression === "*") return { kind: "star", alias: "*" };

  const aggregate = expression.match(/^(SUM|AVG|COUNT|MIN|MAX)\s*\(([\s\S]+)\)$/i);
  if (aggregate) {
    const fn = aggregate[1].toUpperCase();
    const column = aggregate[2].trim() === "*" ? "*" : unquoteIdentifier(aggregate[2]);
    return { kind: "aggregate", fn, column, alias: alias ?? `${fn.toLowerCase()}_${column === "*" ? "all" : column}` };
  }

  const column = unquoteIdentifier(expression);
  return { kind: "column", column, alias: alias ?? column };
}

function parseSql(sql) {
  let source = String(sql ?? "").trim().replace(/;$/, "");
  const limitMatch = source.match(/\s+LIMIT\s+(\d+)\s*$/i);
  const limit = limitMatch ? Number.parseInt(limitMatch[1], 10) : null;
  if (limitMatch) source = source.slice(0, limitMatch.index).trim();

  const orderMatch = source.match(/\s+ORDER\s+BY\s+(.+?)(?:\s+(ASC|DESC))?\s*$/i);
  const orderBy = orderMatch ? { column: unquoteIdentifier(orderMatch[1]), desc: /^DESC$/i.test(orderMatch[2] || "") } : null;
  if (orderMatch) source = source.slice(0, orderMatch.index).trim();

  const groupMatch = source.match(/\s+GROUP\s+BY\s+(.+?)\s*$/i);
  const groupBy = groupMatch ? splitComma(groupMatch[1]).map(unquoteIdentifier) : [];
  if (groupMatch) source = source.slice(0, groupMatch.index).trim();

  const whereMatch = source.match(/\s+WHERE\s+(.+?)\s*$/i);
  const where = whereMatch ? whereMatch[1].trim() : "";
  if (whereMatch) source = source.slice(0, whereMatch.index).trim();

  const selectMatch = source.match(/^SELECT\s+([\s\S]+?)\s+FROM\s+("[^"]+"|`[^`]+`|[\w-]+)$/i);
  if (!selectMatch) throw new Error("Only SELECT ... FROM <table> queries are supported");
  return {
    expressions: splitComma(selectMatch[1]).map(parseSelectExpression),
    table: unquoteIdentifier(selectMatch[2]),
    where,
    groupBy,
    orderBy,
    limit,
  };
}

function compareValues(left, operator, right) {
  if (operator.toUpperCase() === "LIKE") {
    const pattern = String(right).replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/%/g, ".*");
    return new RegExp(`^${pattern}$`, "i").test(String(left ?? ""));
  }
  if (operator === "=") return left === right || String(left) === String(right);
  if (operator === "!=" || operator === "<>") return !(left === right || String(left) === String(right));
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

function filterRows(rows, where) {
  if (!where) return rows;
  const conditions = where.split(/\s+AND\s+/i).map((part) => part.trim()).filter(Boolean);
  return rows.filter((row) => conditions.every((condition) => {
    const match = condition.match(/^("[^"]+"|`[^`]+`|[\w-]+)\s*(=|!=|<>|>=|<=|>|<|LIKE)\s*([\s\S]+)$/i);
    if (!match) throw new Error(`Unsupported WHERE condition: ${condition}`);
    return compareValues(resolveColumn(row, match[1]), match[2], parseLiteral(match[3]));
  }));
}

function aggregateValue(rows, expression) {
  const values = expression.column === "*"
    ? rows
    : rows.map((row) => resolveColumn(row, expression.column)).filter((value) => value != null);
  if (expression.fn === "COUNT") return values.length;
  const numeric = values.map(Number).filter((value) => Number.isFinite(value));
  if (expression.fn === "SUM") return numeric.reduce((sum, value) => sum + value, 0);
  if (expression.fn === "AVG") return numeric.length ? numeric.reduce((sum, value) => sum + value, 0) / numeric.length : null;
  if (expression.fn === "MIN") return numeric.length ? Math.min(...numeric) : null;
  if (expression.fn === "MAX") return numeric.length ? Math.max(...numeric) : null;
  return null;
}

function projectRows(rows, expressions) {
  if (expressions.length === 1 && expressions[0].kind === "star") return rows.map((row) => ({ ...row }));
  return rows.map((row) => {
    const projected = {};
    for (const expression of expressions) {
      if (expression.kind === "column") projected[expression.alias] = resolveColumn(row, expression.column);
      else if (expression.kind === "aggregate") projected[expression.alias] = aggregateValue([row], expression);
      else Object.assign(projected, row);
    }
    return projected;
  });
}

function groupRows(rows, groupBy, expressions) {
  const groups = new Map();
  for (const row of rows) {
    const key = JSON.stringify(groupBy.map((column) => resolveColumn(row, column)));
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }

  return [...groups.values()].map((group) => {
    const output = {};
    for (const column of groupBy) output[column] = resolveColumn(group[0], column);
    for (const expression of expressions) {
      if (expression.kind === "aggregate") output[expression.alias] = aggregateValue(group, expression);
      else if (expression.kind === "column" && !Object.hasOwn(output, expression.alias)) {
        output[expression.alias] = resolveColumn(group[0], expression.column);
      }
    }
    return output;
  });
}

function sortRows(rows, orderBy) {
  if (!orderBy) return rows;
  return [...rows].sort((left, right) => {
    const a = resolveColumn(left, orderBy.column);
    const b = resolveColumn(right, orderBy.column);
    if (a === b) return 0;
    const result = a > b ? 1 : -1;
    return orderBy.desc ? -result : result;
  });
}

function resolveTable(parsed, context) {
  const tableName = context.tableMap[parsed.table] ?? parsed.table;
  const table = context.tables.get(tableName);
  if (!table) {
    const available = Object.entries(context.tableMap).map(([original, name]) => `"${name}" (${original})`).join(", ");
    throw new Error(`Table '${parsed.table}' not found. Available tables: ${available}`);
  }
  return table;
}

export function runQuery(sql, context) {
  const parsed = parseSql(sql);
  const table = resolveTable(parsed, context);
  const rows = filterRows(table.rows, parsed.where);
  const hasAggregate = parsed.expressions.some((expression) => expression.kind === "aggregate");
  let resultRows = hasAggregate || parsed.groupBy.length
    ? groupRows(rows, parsed.groupBy, parsed.expressions)
    : projectRows(rows, parsed.expressions);
  resultRows = sortRows(resultRows, parsed.orderBy);
  if (parsed.limit != null) resultRows = resultRows.slice(0, parsed.limit);
  return resultRows;
}

function rowsToColumns(rows) {
  const columns = [];
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (!columns.includes(key)) columns.push(key);
    }
  }
  return columns;
}

function csvEscape(value) {
  const text = formatValue(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function exportResults(rows, outputFile) {
  const columns = rowsToColumns(rows);
  const target = resolve(outputFile);
  mkdirSync(resolve(target, ".."), { recursive: true });
  const ext = extname(target).toLowerCase();
  if (ext === ".csv") {
    writeFileSync(target, [columns, ...rows.map((row) => columns.map((column) => row[column]))]
      .map((row) => row.map(csvEscape).join(",")).join("\n") + "\n", "utf8");
  } else if (ext === ".json") {
    writeFileSync(target, JSON.stringify(rows, null, 2), "utf8");
  } else if (ext === ".md") {
    const lines = [
      `| ${columns.join(" | ")} |`,
      `| ${columns.map(() => "---").join(" | ")} |`,
      ...rows.map((row) => `| ${columns.map((column) => formatValue(row[column]).replaceAll("|", "\\|")).join(" | ")} |`),
    ];
    writeFileSync(target, lines.join("\n") + "\n", "utf8");
  } else {
    throw new Error(`Unsupported output format: ${ext}. Use .csv, .json, or .md`);
  }
  return `Results exported to ${target} (${rows.length} rows)`;
}

export function actionQuery(context, sql, outputFile = null) {
  try {
    const rows = runQuery(sql, context);
    if (outputFile) {
      const message = exportResults(rows, outputFile);
      console.log(message);
      return message;
    }
    const columns = rowsToColumns(rows);
    const result = rows.length ? `${formatRows(columns, rows)}\n\n(${rows.length} rows)` : "Query returned 0 rows.";
    console.log(result);
    return result;
  } catch (error) {
    const message = [`SQL Error: ${error.message}`, "", "Available tables:"];
    for (const [originalName, tableName] of Object.entries(context.tableMap)) {
      const table = context.tables.get(tableName);
      message.push(`  "${tableName}" (${originalName}): ${table.columns.map((column) => column.name).join(", ")}`);
    }
    const result = message.join("\n");
    console.log(result);
    return result;
  }
}

function quantile(sortedValues, q) {
  if (!sortedValues.length) return null;
  const position = (sortedValues.length - 1) * q;
  const base = Math.floor(position);
  const rest = position - base;
  if (sortedValues[base + 1] == null) return sortedValues[base];
  return sortedValues[base] + rest * (sortedValues[base + 1] - sortedValues[base]);
}

export function actionSummary(context, tableName) {
  const resolvedName = context.tableMap[tableName] ?? tableName;
  const table = context.tables.get(resolvedName);
  if (!table) {
    const available = Object.entries(context.tableMap).map(([original, name]) => `"${name}" (${original})`).join(", ");
    const message = `Table '${tableName}' not found. Available tables: ${available}`;
    console.log(message);
    return message;
  }

  const output = [`\nStatistical Summary: ${tableName}`, `Total rows: ${table.rows.length}`, "=".repeat(70)];
  for (const column of table.columns) {
    const values = table.rows.map((row) => row[column.name]).filter((value) => value != null);
    output.push(`\n--- ${column.name} (${column.type}) ---`);
    if (column.type === "BIGINT" || column.type === "DOUBLE") {
      const numeric = values.map(Number).filter((value) => Number.isFinite(value)).sort((a, b) => a - b);
      const mean = numeric.length ? numeric.reduce((sum, value) => sum + value, 0) / numeric.length : null;
      const variance = numeric.length > 1
        ? numeric.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (numeric.length - 1)
        : null;
      const stats = {
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
        output.push(`  ${label.padEnd(8)}: ${typeof value === "number" ? Number(value.toFixed(4)) : value}`);
      }
    } else {
      const counts = new Map();
      for (const value of values) counts.set(String(value), (counts.get(String(value)) ?? 0) + 1);
      const topValues = [...counts.entries()].sort((left, right) => right[1] - left[1]).slice(0, 5);
      output.push(`  count   : ${values.length}`);
      output.push(`  unique  : ${counts.size}`);
      output.push(`  top     : ${topValues[0]?.[0] ?? ""}`);
      output.push(`  nulls   : ${table.rows.length - values.length}`);
      if (topValues.length) {
        output.push("  top values:");
        for (const [value, frequency] of topValues) {
          const percentage = table.rows.length ? (frequency / table.rows.length * 100).toFixed(1) : "0.0";
          output.push(`    ${value}: ${frequency} (${percentage}%)`);
        }
      }
    }
  }
  const result = output.join("\n");
  console.log(result);
  return result;
}

export function parseArgs(argv = process.argv.slice(2)) {
  const args = { files: [], action: null, sql: null, table: null, outputFile: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--files") {
      while (argv[index + 1] && !argv[index + 1].startsWith("--")) {
        args.files.push(argv[index + 1]);
        index += 1;
      }
    } else if (arg === "--action") {
      args.action = argv[++index];
    } else if (arg === "--sql") {
      args.sql = argv[++index];
    } else if (arg === "--table") {
      args.table = argv[++index];
    } else if (arg === "--output-file") {
      args.outputFile = argv[++index];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  if (!args.files.length) throw new Error("--files is required");
  if (!["inspect", "query", "summary"].includes(args.action)) throw new Error("--action must be inspect, query, or summary");
  if (args.action === "query" && !args.sql) throw new Error("--sql is required for 'query' action");
  if (args.action === "summary" && !args.table) throw new Error("--table is required for 'summary' action");
  return args;
}

export function main(argv = process.argv.slice(2)) {
  let args;
  try {
    args = parseArgs(argv);
  } catch (error) {
    console.error(`${error.message}\nUsage: node scripts/analyze.mjs --files <file...> --action inspect|query|summary [--sql SQL] [--table TABLE] [--output-file PATH]`);
    return 1;
  }

  console.error("Loading files...");
  const context = loadFiles(args.files);
  if (!context.tables.size) {
    console.error("No tables were loaded. Check file paths and formats.");
    return 1;
  }
  console.error(`\nLoaded ${context.tables.size} table(s): ${Object.keys(context.tableMap).join(", ")}`);

  if (args.action === "inspect") actionInspect(context);
  else if (args.action === "query") actionQuery(context, args.sql, args.outputFile);
  else actionSummary(context, args.table);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exitCode = main();
}
