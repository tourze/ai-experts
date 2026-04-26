import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/tauri-expert");
const scriptFiles = ["hooks/dispatch.mjs"].map((file) => resolve(pluginRoot, file));

test("脚本文件通过 Node 语法检查", () => {
  for (const file of scriptFiles) {
    const result = spawnSync("node", ["--check", file], { encoding: "utf-8" });
    assert.equal(result.status, 0, `${file} 语法错误：${result.stderr || result.stdout}`);
  }
});
