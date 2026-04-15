#!/usr/bin/env node
/**
 * Hook 分发器 — 动态发现并执行指定子目录下的所有 hook。
 *
 * 用法：node hooks/dispatch.mjs <subdir>
 * 示例：node hooks/dispatch.mjs pre-tool-use/bash
 *
 * settings.json 只需注册 dispatch.mjs 的入口，
 * 新增 hook 文件放入对应子目录即可，git pull 后自动生效。
 *
 * 每个 hook 模块须导出：
 *   export async function run(payload) → { decision, reason } | null
 */

import { existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const subdir = process.argv[2];

if (!subdir) {
  console.error("Usage: node dispatch.mjs <subdir>");
  process.exit(1);
}

// ── 路径遍历防护 ──────────────────────────────────────
const hooksRoot = resolve(__dirname);
const dir = resolve(__dirname, subdir);
if (dir !== hooksRoot && !dir.startsWith(`${hooksRoot}${sep}`)) {
  console.log(
    JSON.stringify({
      decision: "report",
      reason: `[dispatch] 非法 hook 子目录：${subdir}`,
    }),
  );
  process.exit(0);
}

if (!existsSync(dir)) process.exit(0);

// ── 信号处理：确保被杀时不留残尸 ────────────────────
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => process.exit(sig === "SIGINT" ? 130 : 143));
}

async function readPayload() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(typeof chunk === "string" ? chunk : chunk.toString("utf-8"));
  }

  const raw = chunks.join("").trim();
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch (err) {
    console.log(
      JSON.stringify({
        decision: "report",
        reason: `[dispatch] stdin 不是合法 JSON：${err.message || err}`,
      }),
    );
    process.exit(0);
  }
}

const payload = await readPayload();

// 发现并加载 hook 模块（跳过 _ 前缀的工具模块）
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".mjs") && !f.startsWith("_"))
  .sort();

const reports = [];
const contexts = [];

for (const file of files) {
  try {
    const mod = await import(pathToFileURL(join(dir, file)).href);
    if (typeof mod.run !== "function") continue;

    const result = await mod.run(payload);
    if (!result) continue;

    // block 立即输出并终止
    if (result.decision === "block") {
      console.log(JSON.stringify(result));
      process.exit(0);
    }

    // context 用于 UserPromptSubmit 等事件向 Claude 注入 additionalContext
    if (result.decision === "context") {
      contexts.push(result);
      continue;
    }

    if (result.decision === "report") {
      reports.push(result);
    }
  } catch (err) {
    // hook 异常不应崩溃整个 dispatch，降级为 report
    reports.push({
      decision: "report",
      reason: `[dispatch] hook ${file} 执行异常：${err.message || err}`,
    });
  }
}

// context 优先于 report。根据 subdir 首段推导 hookEventName,
// 例如 user-prompt-submit → UserPromptSubmit, post-tool-use → PostToolUse。
if (contexts.length > 0) {
  const eventName = subdir
    .split("/")[0]
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: eventName,
        additionalContext: contexts.map((c) => c.reason).join("\n\n"),
      },
    }),
  );
} else if (reports.length > 0) {
  console.log(
    JSON.stringify({
      decision: "report",
      reason: reports.map((r) => r.reason).join("\n\n"),
    }),
  );
}
