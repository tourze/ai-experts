import { existsSync, readFileSync } from "node:fs";
import { extname, parse as parsePath } from "node:path";
import { inflateRawSync } from "node:zlib";

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
