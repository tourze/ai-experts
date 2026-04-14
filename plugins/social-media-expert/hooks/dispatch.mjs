#!/usr/bin/env node
/**
 * Hook 分发器：动态发现并执行指定子目录下的所有 hook。
 *
 * 用法：node hooks/dispatch.mjs <subdir>
 * 示例：node hooks/dispatch.mjs session-start
 *
 * 每个 hook 模块须导出：
 *   export async function run(payload) → { decision, reason } | null
 */

import { existsSync, readdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

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
      reason: `[dispatch] stdin 不是合法 JSON：${error.message}`,
    }));
    process.exit(0);
  }
}

const payload = await readPayload();
const files = readdirSync(dir)
  .filter((file) => file.endsWith(".mjs") && !file.startsWith("_"))
  .sort();

const reports = [];
const contexts = [];

for (const file of files) {
  try {
    const mod = await import(join(dir, file));
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
  const eventName = subdir
    .split("/")[0]
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: eventName,
      additionalContext: contexts.map((item) => item.reason).join("\n\n"),
    },
  }));
} else if (reports.length > 0) {
  console.log(JSON.stringify({
    decision: "report",
    reason: reports.map((item) => item.reason).join("\n\n"),
  }));
}
