import { exportResults, formatRows, rowsToColumns } from "./analyze_output";

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
