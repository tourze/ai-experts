import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { resolve } from "node:path";

const pluginRoot = resolve("plugins/coding-expert");

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

