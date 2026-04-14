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

