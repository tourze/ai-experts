import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/docs-expert");

function listFiles(predicate) {
  const results = [];
  const queue = [pluginRoot];

  while (queue.length > 0) {
    const current = queue.pop();
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const next = resolve(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(next);
        continue;
      }
      if (predicate(next)) {
        results.push(next);
      }
    }
  }

  return results.sort();
}

function run(command, args) {
  return spawnSync(command, args, {
    cwd: resolve("."),
    encoding: "utf-8",
  });
}

test("Python 脚本通过 py_compile", () => {
  const files = listFiles((file) => file.endsWith(".py"));
  const result = run("python3", ["-m", "py_compile", ...files]);
  assert.equal(result.status, 0, result.stderr);
});

test("Node 脚本通过 node --check", () => {
  for (const file of listFiles((next) => next.endsWith(".js") || next.endsWith(".mjs"))) {
    const result = run("node", ["--check", file]);
    assert.equal(result.status, 0, `${file}\n${result.stderr}`);
  }
});

test("Shell 脚本通过 bash -n", () => {
  for (const file of listFiles((next) => next.endsWith(".sh"))) {
    const result = run("bash", ["-n", file]);
    assert.equal(result.status, 0, `${file}\n${result.stderr}`);
  }
});
