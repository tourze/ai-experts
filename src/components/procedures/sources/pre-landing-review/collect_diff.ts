#!/usr/bin/env node
import { defineCliProcedure, procedureEntry } from "../../definition";
// 收集 base...HEAD 的 diff 元信息，输出结构化 JSON 供后续渲染脚本使用。
// 保守式脚本化目标：把 SKILL.md 中重复出现的 git diff 命令收敛到一处，
// 让审查者直接拿 JSON，不用每次粘贴命令。判断仍由模型完成。
import { execFileSync } from "node:child_process";

export const procedure = defineCliProcedure({
  id: "pre-landing-review-collect-diff",
  entry: procedureEntry(import.meta.url),
  description:
    "收集 base...HEAD 的 git diff 元信息（文件列表、行数统计），输出结构化 JSON。",
  owners: { skillIds: ["pre-landing-review"] },
  target: "scripts/collect_diff.mjs",
  runtime: "node",
  params: [
    {
      flag: "--base",
      type: "字符串",
      description: "基准分支或 git ref（默认 origin/main）",
      required: false,
    },
    {
      flag: "--cwd",
      type: "路径",
      description: "Git 仓库工作目录",
      required: false,
    },
  ],

  exampleArgs: { args: ["--base", "origin/main"] },
});

function gitOut(args: any, { cwd }: any = {}): any {
  return execFileSync("git", args, { cwd, encoding: "utf-8" }).trimEnd();
}
export function collectDiff({
  base = "origin/main",
  cwd,
  paths = [],
}: any = {}): any {
  const range = `${base}...`;
  const nameOnly = gitOut(
    ["diff", "--name-only", range, ...paths.flatMap((p: any) => ["--", p])],
    { cwd },
  );
  const stat = gitOut(
    ["diff", "--stat", range, ...paths.flatMap((p: any) => ["--", p])],
    { cwd },
  );
  const numstatRaw = gitOut(
    ["diff", "--numstat", range, ...paths.flatMap((p: any) => ["--", p])],
    { cwd },
  );
  const files = nameOnly ? nameOnly.split("\n") : [];
  const numstat = numstatRaw
    ? numstatRaw.split("\n").map((line: any) => {
        const [added, removed, path] = line.split("\t");
        return {
          path,
          added: added === "-" ? null : Number(added),
          removed: removed === "-" ? null : Number(removed),
        };
      })
    : [];
  return {
    base,
    range,
    files,
    fileCount: files.length,
    numstat,
    stat,
    cwd: cwd ?? process.cwd(),
  };
}
function readOptionValue(argv: readonly string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (value == null || value.startsWith("--")) {
    throw new Error(`${flag} requires a value`);
  }
  return value;
}
export function parseArgs(argv: readonly string[]): any {
  const args: Record<string, any> = {
    base: "origin/main",
    cwd: process.cwd(),
    paths: [],
  };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--base") args.base = readOptionValue(argv, i++, a);
    else if (a === "--cwd") args.cwd = readOptionValue(argv, i++, a);
    else if (a === "--") args.paths.push(...argv.slice(i + 1));
    else if (!a.startsWith("--")) args.paths.push(a);
  }
  return args;
}
export function main(argv: readonly string[]): any {
  const args = parseArgs(argv);
  try {
    const result = collectDiff(args);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
    return 0;
  } catch (err: any) {
    process.stderr.write(`collect_diff failed: ${err.message}\n`);
    return 1;
  }
}
