import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/skill-expert");

function collectFiles(dir, predicate) {
  const files = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectFiles(fullPath, predicate));
      continue;
    }
    if (entry.isFile() && predicate(fullPath)) {
      files.push(fullPath);
    }
  }

  return files.sort();
}

test("hook 脚本都能通过 node --check", () => {
  const files = collectFiles(resolve(pluginRoot, "hooks"), (file) => file.endsWith(".mjs"));
  for (const file of files) {
    execFileSync("node", ["--check", file], { stdio: "pipe" });
  }
});

test("plugin.json 与 hooks.json 都是合法 JSON", () => {
  JSON.parse(readFileSync(resolve(pluginRoot, ".claude-plugin/plugin.json"), "utf-8"));
  JSON.parse(readFileSync(resolve(pluginRoot, "hooks/hooks.json"), "utf-8"));
  assert.ok(true);
});

test("复制进插件的 Python 脚本都能通过 py_compile", () => {
  const files = collectFiles(resolve(pluginRoot, "skills"), (file) => file.endsWith(".py"));
  execFileSync("python3", ["-m", "py_compile", ...files], { stdio: "pipe" });
  assert.ok(files.length > 0);
});
