import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const pluginRoot = resolve("plugins/coding-expert");
const dispatchPath = resolve(pluginRoot, "hooks/dispatch.mjs");

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
  assert.equal(output.decision, "report");
  assert.match(output.reason, /stdin 不是合法 JSON/);
});
