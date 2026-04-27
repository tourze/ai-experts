import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/ruby-expert");
const filesToCheck = [
  "hooks/post-tool-use/edit-write/_utils.mjs",
  "hooks/post-tool-use/edit-write/debug-statement-guard.mjs",
  "hooks/post-tool-use/edit-write/syntax-ruby.mjs",
  "tests/hooks.test.mjs",
  "tests/scripts.test.mjs",
  "tests/skill-docs.test.mjs",
];

test("所有 Node 脚本都能通过 node --check", () => {
  for (const relativePath of filesToCheck.filter((file) => file.endsWith(".mjs"))) {
    const filePath = resolve(pluginRoot, relativePath);
    const result = spawnSync("node", ["--check", filePath], {
      cwd: resolve("."),
      encoding: "utf-8",
    });

    assert.equal(
      result.status,
      0,
      `${relativePath} 语法检查失败：${result.stderr || result.stdout}`,
    );
  }
});
