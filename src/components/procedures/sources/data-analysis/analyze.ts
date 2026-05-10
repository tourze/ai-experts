#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
import { loadFiles } from "./analyze_loader";
import { actionInspect, actionSummary } from "./analyze_output";
import { actionQuery } from "./analyze_query";

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

export {
  dedupeIdentifiers,
  loadFiles,
  parseCsv,
  sanitizeIdentifier,
} from "./analyze_loader";
export {
  actionInspect,
  actionSummary,
  exportResults,
} from "./analyze_output";
export { actionQuery, runQuery } from "./analyze_query";

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
