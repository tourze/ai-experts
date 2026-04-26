import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const pluginRoot = resolve("plugins/coding-expert");
const dispatchPath = resolve(pluginRoot, "hooks/dispatch.mjs");

function withTempDispatch(fn) {
  const root = mkdtempSync(join(tmpdir(), "coding-dispatch-"));
  const hooksRoot = join(root, "hooks");
  mkdirSync(hooksRoot, { recursive: true });
  writeFileSync(join(hooksRoot, "dispatch.mjs"), readFileSync(dispatchPath, "utf-8"));
  try {
    return fn(hooksRoot);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("dispatch 在空 stdin 下执行 user-prompt-submit 不崩溃", () => {
  const result = spawnSync("node", [dispatchPath, "user-prompt-submit"], {
    cwd: pluginRoot,
    input: "",
    encoding: "utf-8",
  });

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "");
});

test("dispatch 在命中注释纪律信号时返回 UserPromptSubmit context", () => {
  const result = spawnSync("node", [dispatchPath, "user-prompt-submit"], {
    cwd: pluginRoot,
    input: JSON.stringify({
      prompt: "这段并发锁逻辑需要说明共享状态、顺序保证和线程安全约束",
    }),
    encoding: "utf-8",
  });

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.hookSpecificOutput?.hookEventName, "UserPromptSubmit");
  assert.match(output.hookSpecificOutput?.additionalContext ?? "", /Comment Discipline Primer/);
});

test("dispatch 在非法 JSON stdin 下返回 report", () => {
  const result = spawnSync("node", [dispatchPath, "user-prompt-submit"], {
    cwd: pluginRoot,
    input: "{not-json",
    encoding: "utf-8",
  });

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.decision, undefined);
  assert.match(output.systemMessage, /stdin 不是合法 JSON/);
});

test("SessionStart + report 输出 systemMessage 而非 {decision: report}", () => {
  // 回归：防止 SessionStart 场景再次触发 Claude Code schema 校验错误
  // ("Hook JSON output validation failed — (root): Invalid input")。
  withTempDispatch((hooksRoot) => {
    const hookDir = join(hooksRoot, "session-start");
    mkdirSync(hookDir, { recursive: true });
    writeFileSync(
      join(hookDir, "report-hook.mjs"),
      'export async function run() { return { decision: "report", reason: "test-session-report" }; }\n',
      "utf-8",
    );

    const result = spawnSync("node", [join(hooksRoot, "dispatch.mjs"), "session-start"], {
      cwd: pluginRoot,
      input: "",
      encoding: "utf-8",
      env: { ...process.env, AI_EXPERTS_HOOK_TELEMETRY: "0" },
    });

    assert.equal(result.status, 0);
    const output = JSON.parse(result.stdout);
    assert.equal(output.decision, undefined, "SessionStart 不应输出 decision 字段");
    assert.equal(output.systemMessage, "test-session-report");
  });
});

test("UserPromptSubmit + report 输出 systemMessage", () => {
  withTempDispatch((hooksRoot) => {
    const hookDir = join(hooksRoot, "user-prompt-submit");
    mkdirSync(hookDir, { recursive: true });
    writeFileSync(
      join(hookDir, "report-hook.mjs"),
      'export async function run() { return { decision: "report", reason: "test-prompt-report" }; }\n',
      "utf-8",
    );

    const result = spawnSync("node", [join(hooksRoot, "dispatch.mjs"), "user-prompt-submit"], {
      cwd: pluginRoot,
      input: JSON.stringify({ prompt: "hello" }),
      encoding: "utf-8",
      env: { ...process.env, AI_EXPERTS_HOOK_TELEMETRY: "0" },
    });

    assert.equal(result.status, 0);
    const output = JSON.parse(result.stdout);
    assert.equal(output.decision, undefined);
    assert.equal(output.systemMessage, "test-prompt-report");
  });
});

test("Codex apply_patch tool_input.command 标准化为逐文件 payload", () => {
  withTempDispatch((hooksRoot) => {
    const hookDir = join(hooksRoot, "post-tool-use", "edit-write");
    mkdirSync(hookDir, { recursive: true });
    writeFileSync(
      join(hookDir, "report-target.mjs"),
      "export async function run(payload) { return { decision: 'report', reason: `${payload.tool_input.file_path}|${payload.tool_input.command.includes('Begin Patch')}` }; }\n",
      "utf-8",
    );

    const patch = [
      "*** Begin Patch",
      "*** Add File: src/a.ts",
      "+export const a = 1;",
      "*** Update File: src/b.ts",
      "@@",
      "-old",
      "+new",
      "*** End Patch",
    ].join("\n");

    const result = spawnSync("node", [join(hooksRoot, "dispatch.mjs"), "post-tool-use/edit-write"], {
      cwd: pluginRoot,
      input: JSON.stringify({
        hook_event_name: "PostToolUse",
        tool_name: "apply_patch",
        tool_input: { command: patch },
      }),
      encoding: "utf-8",
      env: { ...process.env, AI_EXPERTS_HOOK_TELEMETRY: "0" },
    });

    assert.equal(result.status, 0);
    const output = JSON.parse(result.stdout);
    assert.match(output.systemMessage, /src\/a\.ts\|true/);
    assert.match(output.systemMessage, /src\/b\.ts\|true/);
  });
});
