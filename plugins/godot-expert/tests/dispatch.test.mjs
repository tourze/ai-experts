import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const dispatchPath = resolve("plugins/godot-expert/hooks/dispatch.mjs");

test("dispatch 对不存在的 hook 子目录直接退出", () => {
  const result = spawnSync("node", [dispatchPath, "not-found"], {
    cwd: resolve("."),
    input: "",
    encoding: "utf-8",
  });

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "");
});

test("dispatch 在空 stdin 下不崩溃", () => {
  const result = spawnSync("node", [dispatchPath, "session-start"], {
    cwd: resolve("."),
    input: "",
    encoding: "utf-8",
  });

  assert.equal(result.status, 0);
});

