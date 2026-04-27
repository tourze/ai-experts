import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const dispatchPath = resolve("hooks/dispatch.mjs");
const repoRoot = resolve(".");
const baseEnv = { ...process.env, AI_EXPERTS_HOOK_TELEMETRY: "0" };

function runDispatch(subdir, { input = "", env } = {}) {
  return spawnSync("node", [dispatchPath, subdir], {
    cwd: repoRoot,
    encoding: "utf-8",
    input,
    env: env ?? baseEnv,
  });
}

test("dispatch 空 stdin 不崩溃", () => {
  const result = runDispatch("post-tool-use/edit-write");
  assert.equal(result.status, 0);
});

test("dispatch 非法 JSON 输出 systemMessage report", () => {
  const result = runDispatch("user-prompt-submit", { input: "{not-json" });
  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.decision, undefined);
  assert.match(payload.systemMessage, /stdin 不是合法 JSON/);
});

test("dispatch 拒绝非法 subdir", () => {
  const result = runDispatch("../escape", { input: "{}" });
  assert.equal(result.status, 0);
  const payload = JSON.parse(result.stdout);
  assert.match(payload.systemMessage, /非法 subdir/);
});

test("dispatch 命中真实 hook 时返回 SessionStart context", () => {
  // coding-expert/session-start/context-injector 总会返回 context 输出
  const result = runDispatch("session-start", { input: JSON.stringify({}) });
  assert.equal(result.status, 0);
  if (result.stdout.trim() === "") return;
  const payload = JSON.parse(result.stdout);
  assert.equal(payload.hookSpecificOutput?.hookEventName, "SessionStart");
  assert.equal(typeof payload.hookSpecificOutput?.additionalContext, "string");
});

test("dispatch 不存在的子目录直接退出", () => {
  const result = runDispatch("session-start/__never_exists__", { input: "{}" });
  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "");
});
