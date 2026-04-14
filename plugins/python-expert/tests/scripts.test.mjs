import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/python-expert");

function walkMjs(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkMjs(fullPath));
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".mjs")) {
      files.push(fullPath);
    }
  }
  return files.sort();
}

test("plugin.json 与 hooks.json 都是合法 JSON", () => {
  JSON.parse(readFileSync(resolve(pluginRoot, ".claude-plugin/plugin.json"), "utf-8"));
  JSON.parse(readFileSync(resolve(pluginRoot, "hooks/hooks.json"), "utf-8"));
});

test("所有 hook 与测试脚本通过 node --check", () => {
  const files = [
    ...walkMjs(resolve(pluginRoot, "hooks")),
    ...walkMjs(resolve(pluginRoot, "tests")),
  ];

  for (const file of files) {
    const result = spawnSync("node", ["--check", file], { encoding: "utf-8" });
    assert.equal(result.status, 0, `${file} 存在语法错误：${result.stderr || result.stdout}`);
  }
});
