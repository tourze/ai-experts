import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/ruby-expert");
const filesToCheck = [
  ".claude-plugin/plugin.json",
  "hooks/hooks.json",
  "hooks/dispatch.mjs",
  "hooks/post-tool-use/edit-write/_utils.mjs",
  "hooks/post-tool-use/edit-write/debug-statement-guard.mjs",
  "hooks/post-tool-use/edit-write/file-budget-guard.mjs",
  "hooks/post-tool-use/edit-write/syntax-ruby.mjs",
  "tests/dispatch.test.mjs",
  "tests/hooks.test.mjs",
  "tests/manifest.test.mjs",
  "tests/scripts.test.mjs",
  "tests/skill-docs.test.mjs",
];

test("plugin.json 与 hooks.json 都是合法 JSON", () => {
  JSON.parse(readFileSync(resolve(pluginRoot, ".claude-plugin/plugin.json"), "utf-8"));
  JSON.parse(readFileSync(resolve(pluginRoot, "hooks/hooks.json"), "utf-8"));
});

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
