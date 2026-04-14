import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const dispatchPath = resolve("plugins/creative-expert/hooks/dispatch.mjs");

test("dispatch 在空 stdin 下不崩溃", () => {
  const result = spawnSync("node", [dispatchPath, "session-start"], {
    cwd: resolve("."),
    input: "",
    encoding: "utf-8",
  });

  assert.equal(result.status, 0);
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
