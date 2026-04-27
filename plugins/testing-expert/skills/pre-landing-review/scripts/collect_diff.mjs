#!/usr/bin/env node
// 收集 base...HEAD 的 diff 元信息，输出结构化 JSON 供后续渲染脚本使用。
// 保守式脚本化目标：把 SKILL.md 中重复出现的 git diff 命令收敛到一处，
// 让审查者直接拿 JSON，不用每次粘贴命令。判断仍由模型完成。
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

function gitOut(args, { cwd } = {}) {
  return execFileSync("git", args, { cwd, encoding: "utf-8" }).trimEnd();
}

export function collectDiff({ base = "origin/main", cwd, paths = [] } = {}) {
  const range = `${base}...`;
  const nameOnly = gitOut(["diff", "--name-only", range, ...paths.flatMap((p) => ["--", p])], { cwd });
  const stat = gitOut(["diff", "--stat", range, ...paths.flatMap((p) => ["--", p])], { cwd });
  const numstatRaw = gitOut(["diff", "--numstat", range, ...paths.flatMap((p) => ["--", p])], { cwd });

  const files = nameOnly ? nameOnly.split("\n") : [];
  const numstat = numstatRaw
    ? numstatRaw.split("\n").map((line) => {
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

function parseArgs(argv) {
  const args = { base: "origin/main", cwd: process.cwd(), paths: [] };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--base") args.base = argv[++i];
    else if (a === "--cwd") args.cwd = argv[++i];
    else if (a === "--") args.paths.push(...argv.slice(i + 1));
    else if (!a.startsWith("--")) args.paths.push(a);
  }
  return args;
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = parseArgs(process.argv.slice(2));
  try {
    const result = collectDiff(args);
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (err) {
    process.stderr.write(`collect_diff failed: ${err.message}\n`);
    process.exit(1);
  }
}
