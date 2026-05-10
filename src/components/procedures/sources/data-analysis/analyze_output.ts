import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { extname, resolve } from "node:path";

export function formatValue(value: any): any {
  if (value == null) return "";
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return String(value);
}
export function formatRows(columns: any, rows: any): any {
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
export function rowsToColumns(rows: any): any {
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
