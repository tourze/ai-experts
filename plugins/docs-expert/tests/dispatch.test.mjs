import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

const pluginRoot = resolve("plugins/docs-expert");
const dispatchSource = resolve(pluginRoot, "hooks/dispatch.mjs");

function withTempDispatch(fn) {
  const root = mkdtempSync(join(tmpdir(), "docs-expert-dispatch-"));
  const hooksRoot = join(root, "hooks");
  mkdirSync(hooksRoot, { recursive: true });
  writeFileSync(join(hooksRoot, "dispatch.mjs"), readFileSync(dispatchSource, "utf-8"));

  try {
    return fn(hooksRoot);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("dispatch 对不存在的 hook 子目录直接退出", () => {
  withTempDispatch((hooksRoot) => {
    const result = spawnSync("node", [join(hooksRoot, "dispatch.mjs"), "not-found"], {
      cwd: pluginRoot,
      input: "",
      encoding: "utf-8",
    });

    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), "");
  });
});

test("dispatch 在空 stdin 下不崩溃", () => {
  withTempDispatch((hooksRoot) => {
    const hookDir = join(hooksRoot, "session-start");
    mkdirSync(hookDir, { recursive: true });
    writeFileSync(join(hookDir, "noop.mjs"), "export async function run() { return null; }\n", "utf-8");

    const result = spawnSync("node", [join(hooksRoot, "dispatch.mjs"), "session-start"], {
      cwd: pluginRoot,
      input: "",
      encoding: "utf-8",
    });

    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), "");
  });
});

test("dispatch 在非法 JSON stdin 下返回 report", () => {
  withTempDispatch((hooksRoot) => {
    const hookDir = join(hooksRoot, "session-start");
    mkdirSync(hookDir, { recursive: true });
    writeFileSync(join(hookDir, "noop.mjs"), "export async function run() { return null; }\n", "utf-8");

    const result = spawnSync("node", [join(hooksRoot, "dispatch.mjs"), "session-start"], {
      cwd: pluginRoot,
      input: "{not-json",
      encoding: "utf-8",
    });

    assert.equal(result.status, 0);
    const output = JSON.parse(result.stdout);
    assert.equal(output.decision, undefined);
    assert.match(output.systemMessage, /stdin 不是合法 JSON/);
  });
});

test("dispatch 聚合多个 report 输出", () => {
  withTempDispatch((hooksRoot) => {
    const hookDir = join(hooksRoot, "session-start");
    mkdirSync(hookDir, { recursive: true });
    writeFileSync(join(hookDir, "a.mjs"), "export async function run() { return { decision: 'report', reason: 'report-a' }; }\n", "utf-8");
    writeFileSync(join(hookDir, "b.mjs"), "export async function run() { return { decision: 'report', reason: 'report-b' }; }\n", "utf-8");

    const result = spawnSync("node", [join(hooksRoot, "dispatch.mjs"), "session-start"], {
      cwd: pluginRoot,
      input: "{}",
      encoding: "utf-8",
    });

    assert.equal(result.status, 0);
    const output = JSON.parse(result.stdout);
    assert.match(output.systemMessage, /report-a/);
    assert.match(output.systemMessage, /report-b/);
  });
});

test("dispatch 聚合多个 context 输出", () => {
  withTempDispatch((hooksRoot) => {
    const hookDir = join(hooksRoot, "user-prompt-submit");
    mkdirSync(hookDir, { recursive: true });
    writeFileSync(join(hookDir, "a.mjs"), "export async function run() { return { decision: 'context', reason: 'context-a' }; }\n", "utf-8");
    writeFileSync(join(hookDir, "b.mjs"), "export async function run() { return { decision: 'context', reason: 'context-b' }; }\n", "utf-8");

    const result = spawnSync("node", [join(hooksRoot, "dispatch.mjs"), "user-prompt-submit"], {
      cwd: pluginRoot,
      input: "{\"prompt\":\"分析迁移计划\"}",
      encoding: "utf-8",
    });

    assert.equal(result.status, 0);
    const output = JSON.parse(result.stdout);
    assert.equal(output.hookSpecificOutput?.hookEventName, "UserPromptSubmit");
    assert.match(output.hookSpecificOutput?.additionalContext ?? "", /context-a/);
    assert.match(output.hookSpecificOutput?.additionalContext ?? "", /context-b/);
  });
});
