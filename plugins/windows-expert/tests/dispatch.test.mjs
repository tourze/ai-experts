import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/windows-expert");
const dispatchSource = resolve(pluginRoot, "hooks/dispatch.mjs");

function withTempDispatch(fn) {
  const root = mkdtempSync(join(tmpdir(), "windows-expert-dispatch-"));
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

test("dispatch 对越界子目录返回 report", () => {
  withTempDispatch((hooksRoot) => {
    const result = spawnSync("node", [join(hooksRoot, "dispatch.mjs"), "../outside"], {
      cwd: pluginRoot,
      input: "",
      encoding: "utf-8",
    });

    assert.equal(result.status, 0);
    const output = JSON.parse(result.stdout);
    assert.equal(output.decision, undefined);
    assert.match(output.systemMessage, /非法 hook 子目录/);
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

test("dispatch 优先输出 block 并终止后续聚合", () => {
  withTempDispatch((hooksRoot) => {
    const hookDir = join(hooksRoot, "session-start");
    mkdirSync(hookDir, { recursive: true });
    writeFileSync(join(hookDir, "a-report.mjs"), "export async function run() { return { decision: 'report', reason: 'report-a' }; }\n", "utf-8");
    writeFileSync(join(hookDir, "b-block.mjs"), "export async function run() { return { decision: 'block', reason: 'stop-now' }; }\n", "utf-8");
    writeFileSync(join(hookDir, "c-report.mjs"), "export async function run() { return { decision: 'report', reason: 'report-c' }; }\n", "utf-8");

    const result = spawnSync("node", [join(hooksRoot, "dispatch.mjs"), "session-start"], {
      cwd: pluginRoot,
      input: "{}",
      encoding: "utf-8",
    });

    assert.equal(result.status, 0);
    const output = JSON.parse(result.stdout);
    assert.equal(output.decision, "block");
    assert.equal(output.reason, "stop-now");
  });
});
