import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { resolve } from "node:path";

const dispatchPath = resolve("plugins/social-media-expert/hooks/dispatch.mjs");

test("dispatch 对不存在的 hook 子目录直接退出", () => {
  const result = spawnSync("node", [dispatchPath, "not-found"], {
    cwd: resolve("."),
    input: "",
    encoding: "utf-8",
  });

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "");
});

test("dispatch 在非法 JSON stdin 下返回 report", () => {
  const result = spawnSync("node", [dispatchPath, "session-start"], {
    cwd: resolve("."),
    input: "{not-json",
    encoding: "utf-8",
  });

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.decision, "report");
  assert.match(output.reason, /stdin 不是合法 JSON/);
});
