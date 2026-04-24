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
 *
 * 遥测：
 *   - 默认按工作区路径记录到 ~/.claude/hook-telemetry/workspaces/<hash>-<name>/decisions.jsonl
 *   - 默认记录 skip，便于自动审计 hook 是否被调用；设置 AI_EXPERTS_HOOK_AUDIT=0 可关闭 skip 降噪
 *   - 设置 AI_EXPERTS_HOOK_TELEMETRY=0 可完全关闭写入
 */

import { createHash } from "node:crypto";
import { appendFileSync, existsSync, mkdirSync, readdirSync, renameSync, rmSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pluginName = basename(resolve(__dirname, ".."));
const subdir = process.argv[2];
const DEBUG = process.env.AI_EXPERTS_DEBUG === "1";
const MAX_STDIN_BYTES = 1024 * 1024; // 1 MB
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
  const contextEvents = new Set(["SessionStart", "UserPromptSubmit", "PostToolUse", "PostToolBatch"]);
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

function parsePositiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseCodexPatchTargets(patchText) {
  const targets = [];
  const seen = new Set();

  for (const line of patchText.split(/\r?\n/u)) {
    const fileMatch = line.match(/^\*\*\* (?:Add|Update|Delete) File:\s*(.+)$/u);
    if (fileMatch) {
      const filePath = fileMatch[1].trim();
      if (filePath && !seen.has(filePath)) {
        seen.add(filePath);
        targets.push(filePath);
      }
      continue;
    }

    const moveMatch = line.match(/^\*\*\* Move to:\s*(.+)$/u);
    if (moveMatch) {
      const filePath = moveMatch[1].trim();
      if (filePath && !seen.has(filePath)) {
        seen.add(filePath);
        targets.push(filePath);
      }
    }
  }

  return targets;
}

function normalizeDispatchPayloads(rawPayload) {
  const payload = rawPayload && typeof rawPayload === "object" ? { ...rawPayload } : {};

  if (payload?.tool_input && typeof payload.tool_input === "object") {
    const { tool_input: toolInput } = payload;
    if (typeof toolInput.cmd === "string" && !toolInput.command) {
      payload.tool_input = {
        ...toolInput,
        command: toolInput.cmd,
      };
    }
  }

  if (typeof payload?.tool_input !== "string") {
    return [payload];
  }

  const patchText = payload.tool_input;
  const patchTargets = parseCodexPatchTargets(patchText);
  if (patchTargets.length === 0) {
    return [payload];
  }

  return patchTargets.map((filePath) => ({
    ...payload,
    tool_input: { file_path: filePath },
    _codex_patch: patchText,
    _codex_patch_targets: patchTargets,
  }));
}

function summarizePayloadTarget(payload) {
  const input = payload?.tool_input;
  if (typeof input?.file_path === "string") {
    return input.file_path;
  }
  if (typeof input?.command === "string") {
    return input.command.replace(/\s+/g, " ").trim().slice(0, 120);
  }
  if (typeof payload?.prompt === "string") {
    return `[prompt:${payload.prompt.length}]`;
  }
  if (typeof payload?.transcript_path === "string") {
    return payload.transcript_path;
  }
  return null;
}

function workspacePathForTelemetry(payload) {
  if (typeof process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE === "string" &&
      process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE.trim()) {
    return resolve(process.env.AI_EXPERTS_HOOK_TELEMETRY_WORKSPACE);
  }
  if (typeof payload?.cwd === "string" && payload.cwd.trim()) {
    return resolve(payload.cwd);
  }
  const filePath = payload?.tool_input?.file_path;
  if (typeof filePath === "string" && filePath.trim()) {
    return resolve(dirname(filePath));
  }
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
  return {
    workspacePath,
    dir: telemetryBucketForWorkspace(workspacePath),
    file: join(telemetryBucketForWorkspace(workspacePath), "decisions.jsonl"),
  };
}

function rotateTelemetryFile(filePath) {
  if (!existsSync(filePath)) {
    return;
  }

  try {
    if (statSync(filePath).size < TELEMETRY_MAX_BYTES) {
      return;
    }

    const rotations = Math.max(0, TELEMETRY_MAX_FILES - 1);
    if (rotations === 0) {
      rmSync(filePath, { force: true });
      return;
    }

    const oldest = `${filePath}.${rotations}`;
    if (existsSync(oldest)) {
      rmSync(oldest, { force: true });
    }

    for (let index = rotations; index >= 1; index -= 1) {
      const source = index === 1 ? filePath : `${filePath}.${index - 1}`;
      const target = `${filePath}.${index}`;
      if (existsSync(source)) {
        renameSync(source, target);
      }
    }
  } catch {
    // 轮转失败不应影响 hook 正常流程。
  }
}

function recordHookTelemetry({
  hook = "[dispatch]",
  event = subdir || "unknown",
  decision,
  payload = null,
  detail = null,
  durationMs = null,
}) {
  if (!TELEMETRY_ENABLED) {
    return;
  }
  if (decision === "skip" && !RECORD_SKIPS) {
    return;
  }

  try {
    const telemetry = telemetryFileForPayload(payload);
    if (!existsSync(telemetry.dir)) {
      mkdirSync(telemetry.dir, { recursive: true });
    }
    rotateTelemetryFile(telemetry.file);
    appendFileSync(
      telemetry.file,
      JSON.stringify({
        ts: Date.now(),
        pid: process.pid,
        session_id: payload?.session_id ?? null,
        transcript_path: payload?.transcript_path ?? null,
        workspace: telemetry.workspacePath,
        plugin: pluginName,
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
    // 遥测失败不应影响 hook 正常流程。
  }
}

if (!subdir) {
  console.error("Usage: node dispatch.mjs <subdir>");
  process.exit(1);
}

// ── 路径遍历防护 ──────────────────────────────────────
const hooksRoot = resolve(__dirname);
const dir = resolve(__dirname, subdir);
if (dir !== hooksRoot && !dir.startsWith(`${hooksRoot}${sep}`)) {
  const reason = `[dispatch] 非法 hook 子目录：${subdir}`;
  recordHookTelemetry({
    decision: "report",
    detail: reason,
  });
  emitSystemMessage(reason);
  process.exit(0);
}

if (!existsSync(dir)) process.exit(0);

// ── 信号处理：确保被杀时不留残尸 ────────────────────
for (const sig of ["SIGINT", "SIGTERM"]) {
  process.on(sig, () => process.exit(sig === "SIGINT" ? 130 : 143));
}

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
    console.error(
      `[dispatch][debug] stdin truncated at ${MAX_STDIN_BYTES} bytes`,
    );
  }

  const raw = chunks.join("").trim();
  if (!raw) return {};

  try {
    const payload = JSON.parse(raw);
    if (truncated) payload._stdinTruncated = true;
    return payload;
  } catch (err) {
    const reason = `[dispatch] stdin 不是合法 JSON：${err.message || err}`;
    recordHookTelemetry({
      decision: "report",
      detail: reason,
    });
    emitSystemMessage(reason);
    process.exit(0);
  }
}

const rawPayload = await readPayload();

// ── Codex payload 标准化 ──────────────────────────────
// Codex CLI 的工具名和 payload 结构与 Claude Code 不同：
//   apply_patch: tool_input 是 patch 字符串，可能包含多文件 Add/Update/Delete/Move
//   exec_command: tool_input.cmd 而非 tool_input.command
// 此处标准化为 Claude Code 格式，并在 apply_patch 多文件场景下逐文件运行 hooks。
const payloads = normalizeDispatchPayloads(rawPayload);

// 发现并加载 hook 模块（跳过 _ 前缀的工具模块）
const files = readdirSync(dir)
  .filter((f) => f.endsWith(".mjs") && !f.startsWith("_"))
  .sort();

const reports = [];
const contexts = [];

if (DEBUG) {
  const eventName = payloads[0]?.hook_event_name ?? "unknown";
  const toolName = payloads[0]?.tool_name ?? "";
  console.error(
    `[dispatch][debug] event=${eventName}${toolName ? ` tool=${toolName}` : ""} subdir=${subdir} hooks=${files.length} targets=${payloads.length} files=[${files.join(",")}]`,
  );
}

for (const file of files) {
  try {
    const mod = await import(pathToFileURL(join(dir, file)).href);
    if (typeof mod.run !== "function") {
      recordHookTelemetry({
        hook: file,
        decision: "skip",
        payload: payloads[0] ?? null,
        detail: "module has no run(payload) export",
        durationMs: null,
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
            `[dispatch][debug] ${file} ${durationMs.toFixed(1)}ms → ${result?.decision ?? "skip"}`,
          );
        }

        if (!result) {
          recordHookTelemetry({
            hook: file,
            decision: "skip",
            payload,
            durationMs,
          });
          continue;
        }

        // block 立即输出并终止
        if (result.decision === "block") {
          recordHookTelemetry({
            hook: file,
            decision: "block",
            payload,
            detail: result.reason,
            durationMs,
          });
          console.log(JSON.stringify(result));
          process.exit(0);
        }

        // context 用于 UserPromptSubmit 等事件向 Claude 注入 additionalContext
        if (result.decision === "context") {
          recordHookTelemetry({
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
        if (DEBUG) {
          console.error(`[dispatch][debug] ${file} ${durationMs.toFixed(1)}ms → ERROR: ${err.message}`);
        }
        recordHookTelemetry({
          hook: file,
          decision: "error",
          payload,
          detail: err.message || err,
          durationMs,
        });
        // hook 异常不应崩溃整个 dispatch，降级为 report
        reports.push({
          decision: "report",
          reason: `[dispatch] hook ${file} 执行异常：${err.message || err}`,
        });
      }
    }
  } catch (err) {
    if (DEBUG) {
      console.error(`[dispatch][debug] ${file} import ERROR: ${err.message}`);
    }
    recordHookTelemetry({
      hook: file,
      decision: "error",
      payload: payloads[0] ?? null,
      detail: err.message || err,
      durationMs: null,
    });
    // hook 异常不应崩溃整个 dispatch，降级为 report
    reports.push({
      decision: "report",
      reason: `[dispatch] hook ${file} 执行异常：${err.message || err}`,
    });
  }
}

if (contexts.length > 0) {
  emitContext(contexts.map((c) => c.reason).join("\n\n"));
} else if (reports.length > 0) {
  const combinedReason = reports.map((r) => r.reason).join("\n\n");
  emitSystemMessage(combinedReason);
}
