import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/linux-expert");
const scriptFiles = [
  "hooks/post-tool-use/edit-write/_utils.mjs",
  "hooks/post-tool-use/edit-write/lint-shellcheck.mjs",
  "hooks/post-tool-use/edit-write/syntax-bash.mjs",
  "hooks/post-tool-use/edit-write/syntax-zsh.mjs",
].map((file) => resolve(pluginRoot, file));

test("所有 hook 脚本都能通过 node --check", () => {
  for (const file of scriptFiles) {
    const result = spawnSync("node", ["--check", file], { encoding: "utf-8" });
    assert.equal(result.status, 0, `${file} 语法错误：${result.stderr || result.stdout}`);
  }
});
