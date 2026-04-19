#!/usr/bin/env node
/**
 * 同步所有插件的 hooks/dispatch.mjs。
 *
 * dispatch 需要随插件独立分发，不能在运行时跨插件 import；因此源码由
 * scripts/templates/hook-dispatch.mjs 生成到每个插件目录。
 *
 * 用法：
 *   node scripts/sync-hook-dispatch.mjs --check
 *   node scripts/sync-hook-dispatch.mjs --write
 */

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const repoRoot = resolve(".");
const templatePath = resolve(repoRoot, "scripts", "templates", "hook-dispatch.mjs");

function parseArgs(argv) {
  const args = { check: false, write: false };
  for (const arg of argv) {
    if (arg === "--check") args.check = true;
    else if (arg === "--write") args.write = true;
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (args.check === args.write) {
    throw new Error("Use exactly one of --check or --write");
  }
  return args;
}

function listTrackedDispatchFiles() {
  return execFileSync("git", ["ls-files"], {
    cwd: repoRoot,
    encoding: "utf-8",
  })
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("plugins/") && line.endsWith("/hooks/dispatch.mjs"))
    .map((line) => resolve(repoRoot, line))
    .sort();
}

function run(args) {
  const expected = readFileSync(templatePath, "utf-8");
  const changed = [];

  for (const file of listTrackedDispatchFiles()) {
    const actual = existsSync(file) ? readFileSync(file, "utf-8") : null;
    if (actual === expected) {
      continue;
    }

    changed.push(file);
    if (args.write) {
      const dir = resolve(file, "..");
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      writeFileSync(file, expected, "utf-8");
    }
  }

  if (changed.length === 0) {
    console.log(args.write ? "sync-hook-dispatch: already up to date" : "sync-hook-dispatch: OK");
    return;
  }

  if (args.check) {
    for (const file of changed) {
      console.error(`out of sync: ${file.replace(`${repoRoot}/`, "")}`);
    }
    process.exitCode = 1;
    return;
  }

  for (const file of changed) {
    console.log(`updated ${file.replace(`${repoRoot}/`, "")}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    run(parseArgs(process.argv.slice(2)));
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
