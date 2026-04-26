#!/usr/bin/env node
/**
 * 统一 hook 分发器 — 跨插件聚合执行。
 *
 * 用法：node hooks/dispatch.mjs <subdir>
 * 示例：node hooks/dispatch.mjs pre-tool-use/bash
 *
 * 与旧版每插件 dispatch.mjs 的区别：
 *   - 入口只有这一个，由 ~/.claude/settings.json 与 ~/.codex/hooks.json 引用
 *   - 扫描范围扩展为 <repoRoot>/plugins/<plugin>/hooks/<subdir>/*.mjs
 *   - 按插件目录名排序、再按文件名排序，行为可预期
 *
 * 协议（与旧版兼容）：
 *   每个 hook 模块导出 export async function run(payload) → { decision, reason } | null
 *   decision ∈ { "block", "context", "report" }
 *   - block: 立即输出并终止后续 hook
 *   - context: 收集，输出为 hookSpecificOutput.additionalContext（仅对支持的事件）
 *   - report: 收集，输出为 systemMessage
 *
 * 遥测：
 *   - 默认按工作区路径写入 ~/.claude/hook-telemetry/workspaces/<hash>-<name>/decisions.jsonl
 *   - AI_EXPERTS_HOOK_TELEMETRY=0 关闭；AI_EXPERTS_HOOK_AUDIT=0 关闭 skip 记录
 */

import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..");
const pluginsRoot = join(repoRoot, "plugins");
const subdir = process.argv[2];

const DEBUG = process.env.AI_EXPERTS_DEBUG === "1";
const MAX_STDIN_BYTES = 1024 * 1024;
const TELEMETRY_ENABLED = process.env.AI_EXPERTS_HOOK_TELEMETRY !== "0";
const RECORD_SKIPS = process.env.AI_EXPERTS_HOOK_AUDIT !== "0";
const TELEMETRY_ROOT = process.env.AI_EXPERTS_HOOK_TELEMETRY_DIR ||
  join(homedir(), ".claude", "hook-telemetry");
const TELEMETRY_MAX_BYTES = parsePositiveInt(
  process.env.AI_EXPERTS_HOOK_TELEMETRY_MAX_BYTES,
  5 * 1024 * 1024,
);
const TELEMETRY_MAX_FILES = parsePositiveInt(
  process.env.AI_EXPERTS_HOOK_TELEMETRY_MAX_FILES,
  5,
);

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function hookEventNameFromSubdir(value) {
  return String(value || "unknown")
    .split("/")[0]
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

const eventName = hookEventNameFromSubdir(subdir);

function emitSystemMessage(message) {
  console.log(JSON.stringify({ systemMessage: message }));
}

function emitContext(message) {
  const contextEvents = new Set([
    "SessionStart",
    "UserPromptSubmit",
    "PostToolUse",
    "PostToolBatch",
  ]);
  if (!contextEvents.has(eventName)) {
    emitSystemMessage(message);
    return;
  }
  console.log(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: eventName,
        additionalContext: message,
      },
    }),
  );
}

// 多个 hook 各自在自己的 reason 头部贴 <SUBAGENT-STOP>...</SUBAGENT-STOP>
// 时，dispatcher 拼接后会出现重复段。这里按 wrapper 文本字面去重：
// 保留每段 wrapper 的首次出现，剥离后续完全相同的复制。不同正文的 wrapper
// 仍各自保留（保守策略）。最后折叠 3+ 连续空行，避免剥离后留下空隙。
function dedupeSubagentStopBlocks(text) {
  const re = /<SUBAGENT-STOP>[\s\S]*?<\/SUBAGENT-STOP>/g;
  const seen = new Set();
  const stripped = text.replace(re, (match) => {
    if (seen.has(match)) return "";
    seen.add(match);
    return match;
  });
  return stripped.replace(/\n{3,}/g, "\n\n");
}

// ── Codex payload 标准化 ──────────────────────────────
// Codex 的 apply_patch 把 patch 文本塞在 tool_input.command（或直接是字符串），
// 并且 exec_command 用 tool_input.cmd 而非 .command。这里映射回 Claude Code 的形态，
// 并在 apply_patch 多文件场景下逐文件展开 payload。

function parseCodexPatchTargets(patchText) {
  const targets = [];
  const seen = new Set();
  for (const line of patchText.split(/\r?\n/u)) {
    const m = line.match(/^\*\*\* (?:Add|Update|Delete) File:\s*(.+)$/u);
    if (m) {
      const p = m[1].trim();
      if (p && !seen.has(p)) {
        seen.add(p);
        targets.push(p);
      }
      continue;
    }
    const mv = line.match(/^\*\*\* Move to:\s*(.+)$/u);
    if (mv) {
      const p = mv[1].trim();
      if (p && !seen.has(p)) {
        seen.add(p);
        targets.push(p);
      }
    }
  }
  return targets;
}

function looksLikeApplyPatch(text) {
  return /^\s*\*\*\* Begin Patch/m.test(text) && /^\*\*\* End Patch/m.test(text);
}

function extractCodexPatchText(payload) {
  const input = payload?.tool_input;
  if (typeof input === "string") {
    return looksLikeApplyPatch(input) ? input : null;
  }
  if (!input || typeof input !== "object") return null;
  const cmd = typeof input.command === "string" ? input.command : null;
  if (!cmd) return null;
  if (payload?.tool_name === "apply_patch" || looksLikeApplyPatch(cmd)) return cmd;
  return null;
}

function normalizeDispatchPayloads(rawPayload) {
  const payload = rawPayload && typeof rawPayload === "object" ? { ...rawPayload } : {};
  if (payload?.tool_input && typeof payload.tool_input === "object") {
    const ti = payload.tool_input;
    if (typeof ti.cmd === "string" && !ti.command) {
      payload.tool_input = { ...ti, command: ti.cmd };
    }
  }
  const patchText = extractCodexPatchText(payload);
  if (!patchText) return [payload];
  const targets = parseCodexPatchTargets(patchText);
  if (targets.length === 0) return [payload];
  return targets.map((file_path) => ({
    ...payload,
    tool_input: {
      ...(payload.tool_input && typeof payload.tool_input === "object"
        ? payload.tool_input
        : { command: patchText }),
      file_path,
    },
    _codex_patch: patchText,
    _codex_patch_targets: targets,
  }));
}

// ── 遥测 ─────────────────────────────────────────────

function summarizePayloadTarget(payload) {
  const input = payload?.tool_input;
  if (typeof input?.file_path === "string") return input.file_path;
  if (typeof input?.command === "string") return input.command.replace(/\s+/g, " ").trim().slice(0, 120);
  if (typeof payload?.prompt === "string") return `[prompt:${payload.prompt.length}]`;
  if (typeof payload?.transcript_path === "string") return payload.transcript_path;
  return null;
}

function workspacePathForTelemetry(payload) {
  const envOverride = process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE;
  if (typeof envOverride === "string" && envOverride.trim()) return resolve(envOverride);
  if (typeof payload?.cwd === "string" && payload.cwd.trim()) return resolve(payload.cwd);
  const filePath = payload?.tool_input?.file_path;
  if (typeof filePath === "string" && filePath.trim()) return resolve(dirname(filePath));
  return resolve(process.cwd());
}

function telemetryBucketForWorkspace(workspacePath) {
  const hash = createHash("sha256").update(workspacePath).digest("hex").slice(0, 12);
  const rawName = basename(workspacePath) || "workspace";
  const slug = rawName.replace(/[^A-Za-z0-9._-]+/g, "-").slice(0, 48) || "workspace";
  return join(TELEMETRY_ROOT, "workspaces", `${hash}-${slug}`);
}

function telemetryFileForPayload(payload) {
  const workspacePath = workspacePathForTelemetry(payload);
  const dir = telemetryBucketForWorkspace(workspacePath);
  return { workspacePath, dir, file: join(dir, "decisions.jsonl") };
}

function rotateTelemetryFile(filePath) {
  if (!existsSync(filePath)) return;
  try {
    if (statSync(filePath).size < TELEMETRY_MAX_BYTES) return;
    const rotations = Math.max(0, TELEMETRY_MAX_FILES - 1);
    if (rotations === 0) {
      rmSync(filePath, { force: true });
      return;
    }
    const oldest = `${filePath}.${rotations}`;
    if (existsSync(oldest)) rmSync(oldest, { force: true });
    for (let index = rotations; index >= 1; index -= 1) {
      const source = index === 1 ? filePath : `${filePath}.${index - 1}`;
      const target = `${filePath}.${index}`;
      if (existsSync(source)) renameSync(source, target);
    }
  } catch {
    // 轮转失败不影响主流程
  }
}

function recordHookTelemetry({
  plugin = "[unknown]",
  hook = "[dispatch]",
  event = subdir || "unknown",
  decision,
  payload = null,
  detail = null,
  durationMs = null,
}) {
  if (!TELEMETRY_ENABLED) return;
  if (decision === "skip" && !RECORD_SKIPS) return;
  try {
    const t = telemetryFileForPayload(payload);
    if (!existsSync(t.dir)) mkdirSync(t.dir, { recursive: true });
    rotateTelemetryFile(t.file);
    appendFileSync(
      t.file,
      JSON.stringify({
        ts: Date.now(),
        pid: process.pid,
        session_id: payload?.session_id ?? null,
        transcript_path: payload?.transcript_path ?? null,
        workspace: t.workspacePath,
        plugin,
        hook,
        event,
        decision,
        tool: payload?.tool_name ?? null,
        file: summarizePayloadTarget(payload),
        detail: detail ? String(detail).replace(/\s+/g, " ").trim().slice(0, 240) : null,
        duration_ms: typeof durationMs === "number" ? Math.round(durationMs * 10) / 10 : null,
      }) + "\n",
      "utf-8",
    );
  } catch {
    // 遥测失败不影响主流程
  }
}

// ── 入参校验 ─────────────────────────────────────────

if (!subdir) {
  console.error("Usage: node dispatch.mjs <subdir>");
  process.exit(1);
}

if (subdir.split(/[\\/]/u).some((part) => part === "" || part === "." || part === "..")) {
  const reason = `[dispatch] 非法 subdir：${subdir}`;
  recordHookTelemetry({ decision: "report", detail: reason });
  emitSystemMessage(reason);
  process.exit(0);
}

if (!existsSync(pluginsRoot)) {
  if (DEBUG) console.error(`[dispatch][debug] plugins root missing: ${pluginsRoot}`);
  process.exit(0);
}

// ── 信号处理 ─────────────────────────────────────────
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => process.exit(sig === "SIGINT" ? 130 : 143));
}

// ── 读取 stdin ────────────────────────────────────────

async function readPayload() {
  const chunks = [];
  let totalBytes = 0;
  let truncated = false;
  for await (const chunk of process.stdin) {
    const str = typeof chunk === "string" ? chunk : chunk.toString("utf-8");
    const byteLen = Buffer.byteLength(str, "utf-8");
    if (totalBytes + byteLen > MAX_STDIN_BYTES) {
      const remaining = MAX_STDIN_BYTES - totalBytes;
      if (remaining > 0) chunks.push(str.slice(0, remaining));
      truncated = true;
      break;
    }
    chunks.push(str);
    totalBytes += byteLen;
  }
  if (truncated && DEBUG) {
    console.error(`[dispatch][debug] stdin truncated at ${MAX_STDIN_BYTES} bytes`);
  }
  const raw = chunks.join("").trim();
  if (!raw) return {};
  try {
    const payload = JSON.parse(raw);
    if (truncated) payload._stdinTruncated = true;
    return payload;
  } catch (err) {
    const reason = `[dispatch] stdin 不是合法 JSON：${err.message || err}`;
    recordHookTelemetry({ decision: "report", detail: reason });
    emitSystemMessage(reason);
    process.exit(0);
  }
}

const rawPayload = await readPayload();
const payloads = normalizeDispatchPayloads(rawPayload);

// ── 跨插件发现 hook 文件 ──────────────────────────────

const hookEntries = [];
const pluginNames = readdirSync(pluginsRoot, { withFileTypes: true })
  .filter((e) => e.isDirectory() && !e.name.startsWith("."))
  .map((e) => e.name)
  .sort();

for (const plugin of pluginNames) {
  const dir = join(pluginsRoot, plugin, "hooks", subdir);
  if (!existsSync(dir)) continue;

  // 二次防护：解析后路径必须仍然落在该插件的 hooks 目录下
  const pluginHooksRoot = join(pluginsRoot, plugin, "hooks");
  const resolvedDir = resolve(dir);
  if (resolvedDir !== pluginHooksRoot && !resolvedDir.startsWith(pluginHooksRoot + sep)) {
    continue;
  }

  let stat;
  try {
    stat = statSync(resolvedDir);
  } catch {
    continue;
  }
  if (!stat.isDirectory()) continue;

  const files = readdirSync(resolvedDir)
    .filter((f) => f.endsWith(".mjs") && !f.startsWith("_"))
    .sort();
  for (const file of files) {
    hookEntries.push({ plugin, file, path: join(resolvedDir, file) });
  }
}

if (DEBUG) {
  console.error(
    `[dispatch][debug] event=${eventName} subdir=${subdir} plugins=${pluginNames.length} hooks=${hookEntries.length} payloads=${payloads.length}`,
  );
}

if (hookEntries.length === 0) process.exit(0);

// ── 执行 ─────────────────────────────────────────────

const reports = [];
const contexts = [];

for (const entry of hookEntries) {
  const { plugin, file, path: hookPath } = entry;
  let mod;
  try {
    mod = await import(pathToFileURL(hookPath).href);
  } catch (err) {
    if (DEBUG) console.error(`[dispatch][debug] import failed ${plugin}/${file}: ${err.message}`);
    recordHookTelemetry({
      plugin,
      hook: file,
      decision: "error",
      payload: payloads[0] ?? null,
      detail: err.message || err,
    });
    reports.push({
      decision: "report",
      reason: `[dispatch] hook ${plugin}/${file} 加载异常：${err.message || err}`,
    });
    continue;
  }

  if (typeof mod.run !== "function") {
    recordHookTelemetry({
      plugin,
      hook: file,
      decision: "skip",
      payload: payloads[0] ?? null,
      detail: "module has no run(payload) export",
    });
    continue;
  }

  for (const payload of payloads) {
    const t0 = performance.now();
    try {
      const result = await mod.run(payload);
      const durationMs = performance.now() - t0;
      if (DEBUG) {
        console.error(
          `[dispatch][debug] ${plugin}/${file} ${durationMs.toFixed(1)}ms → ${result?.decision ?? "skip"}`,
        );
      }
      if (!result) {
        recordHookTelemetry({ plugin, hook: file, decision: "skip", payload, durationMs });
        continue;
      }
      if (result.decision === "block") {
        recordHookTelemetry({
          plugin,
          hook: file,
          decision: "block",
          payload,
          detail: result.reason,
          durationMs,
        });
        console.log(JSON.stringify(result));
        process.exit(0);
      }
      if (result.decision === "context") {
        recordHookTelemetry({
          plugin,
          hook: file,
          decision: "context",
          payload,
          detail: result.reason,
          durationMs,
        });
        contexts.push(result);
        continue;
      }
      if (result.decision === "report") {
        recordHookTelemetry({
          plugin,
          hook: file,
          decision: "report",
          payload,
          detail: result.reason,
          durationMs,
        });
        reports.push(result);
      }
    } catch (err) {
      const durationMs = performance.now() - t0;
      if (DEBUG) console.error(`[dispatch][debug] ${plugin}/${file} ERROR: ${err.message}`);
      recordHookTelemetry({
        plugin,
        hook: file,
        decision: "error",
        payload,
        detail: err.message || err,
        durationMs,
      });
      reports.push({
        decision: "report",
        reason: `[dispatch] hook ${plugin}/${file} 执行异常：${err.message || err}`,
      });
    }
  }
}

if (contexts.length > 0) {
  emitContext(dedupeSubagentStopBlocks(contexts.map((c) => c.reason).join("\n\n")));
} else if (reports.length > 0) {
  emitSystemMessage(reports.map((r) => r.reason).join("\n\n"));
}
