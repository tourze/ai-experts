import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

const dispatchPath = resolve("plugins/git-expert/hooks/dispatch.mjs");

test("dispatch 在空 stdin 下不崩溃", () => {
  const result = spawnSync("node", [dispatchPath, "pre-tool-use/bash"], {
    cwd: resolve("."),
    input: "",
    encoding: "utf-8",
  });

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "");
});

test("dispatch 在空 stdin 下可以执行 session-start hook", () => {
  const result = spawnSync("node", [dispatchPath, "session-start"], {
    cwd: resolve("."),
    input: JSON.stringify({ cwd: resolve(".") }),
    encoding: "utf-8",
  });

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.hookSpecificOutput?.hookEventName, "SessionStart");
  assert.match(output.hookSpecificOutput?.additionalContext ?? "", /📌 Git 工作流/);
});

test("dispatch 在非 git 目录执行 session-start hook 时不输出 context", () => {
  const tempDir = mkdtempSync(resolve(tmpdir(), "git-expert-dispatch-"));

  try {
    const result = spawnSync("node", [dispatchPath, "session-start"], {
      cwd: resolve("."),
      input: JSON.stringify({ cwd: tempDir }),
      encoding: "utf-8",
    });

    assert.equal(result.status, 0);
    assert.equal(result.stdout.trim(), "");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("dispatch 在非法 JSON stdin 下返回 report", () => {
  const result = spawnSync("node", [dispatchPath, "pre-tool-use/bash"], {
    cwd: resolve("."),
    input: "{not-json",
    encoding: "utf-8",
  });

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.decision, "report");
  assert.match(output.reason, /stdin 不是合法 JSON/);
});
