import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const pluginRoot = resolve("plugins/vue-expert");

const nodeScripts = [
  "hooks/dispatch.mjs",
];

test("所有 Node 脚本都能通过语法检查", () => {
  for (const relativePath of nodeScripts) {
    const result = spawnSync("node", ["--check", resolve(pluginRoot, relativePath)], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, `${relativePath} 语法检查失败: ${result.stderr}`);
  }
});
