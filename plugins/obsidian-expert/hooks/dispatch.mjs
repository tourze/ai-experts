#!/usr/bin/env node
/**
 * Hook 分发器：动态加载指定子目录下的 hook 模块并聚合输出。
 *
 * 用法：
 *   node hooks/dispatch.mjs session-start
 *   node hooks/dispatch.mjs pre-tool-use/bash
 *
 * 约定：
 *   - 每个 hook 模块导出 async run(payload)
 *   - 返回 null 表示无输出
 *   - 返回 { decision, reason } 表示 report/context/block
 */

import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const subdir = process.argv[2];

if (!subdir) {
  console.error("Usage: node dispatch.mjs <subdir>");
  process.exit(1);
}

const dir = join(__dirname, subdir);
if (!existsSync(dir)) {
  process.exit(0);
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => process.exit(signal === "SIGINT" ? 130 : 143));
}

async function readPayload() {
  const chunks = [];

  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }

  const raw = chunks.join("").trim();
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.log(JSON.stringify({
      decision: "report",
      reason: `[dispatch] stdin 不是合法 JSON：${error.message || error}`,
    }));
    process.exit(0);
  }
}

function buildEventName(input) {
  return input
    .split("/")[0]
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

const payload = await readPayload();
const files = readdirSync(dir)
  .filter((file) => file.endsWith(".mjs") && !file.startsWith("_"))
  .sort();

const reports = [];
const contexts = [];

for (const file of files) {
  try {
    const moduleUrl = pathToFileURL(join(dir, file)).href;
    const mod = await import(moduleUrl);
    if (typeof mod.run !== "function") {
      continue;
    }

    const result = await mod.run(payload);
    if (!result) {
      continue;
    }

    if (result.decision === "block") {
      console.log(JSON.stringify(result));
      process.exit(0);
    }

    if (result.decision === "context") {
      contexts.push(result);
      continue;
    }

    if (result.decision === "report") {
      reports.push(result);
    }
  } catch (error) {
    reports.push({
      decision: "report",
      reason: `[dispatch] hook ${file} 执行异常：${error.message || error}`,
    });
  }
}

if (contexts.length > 0) {
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: buildEventName(subdir),
      additionalContext: contexts.map((item) => item.reason).join("\n\n"),
    },
  }));
} else if (reports.length > 0) {
  console.log(JSON.stringify({
    decision: "report",
    reason: reports.map((item) => item.reason).join("\n\n"),
  }));
}
