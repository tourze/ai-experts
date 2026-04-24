import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/youtube-expert");
const dispatchPath = resolve(pluginRoot, "hooks/dispatch.mjs");

test("dispatch 对不存在的 hook 子目录直接退出", () => {
  const result = spawnSync("node", [dispatchPath, "not-found"], {
    cwd: pluginRoot,
    input: "",
    encoding: "utf-8",
  });

  assert.equal(result.status, 0);
  assert.equal(result.stdout.trim(), "");
});

test("dispatch 对越界子目录返回 report", () => {
  const result = spawnSync("node", [dispatchPath, "../outside"], {
    cwd: pluginRoot,
    input: "",
    encoding: "utf-8",
  });

  assert.equal(result.status, 0);
  const output = JSON.parse(result.stdout);
  assert.equal(output.decision, undefined);
  assert.match(output.systemMessage, /非法 hook 子目录/);
});
