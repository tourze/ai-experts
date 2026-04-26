import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

const pluginRoot = resolve("plugins/thinking-expert");
const scriptFiles = [
  "hooks/dispatch.mjs",
];

function run(command, args) {
  return spawnSync(command, args, {
    cwd: resolve("."),
    encoding: "utf-8",
  });
}

test("Hook 脚本通过 node --check", () => {
  for (const file of scriptFiles) {
    const result = run("node", ["--check", resolve(pluginRoot, file)]);
    assert.equal(result.status, 0, `${file}\n${result.stderr}`);
  }
});
