import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

const pluginRoot = resolve("plugins/testing-expert");
const assessCodeScript = resolve(pluginRoot, "skills/brutal-honesty-review/scripts/assess-code.mjs");
const assessTestsScript = resolve(pluginRoot, "skills/brutal-honesty-review/scripts/assess-tests.mjs");

test("brutal-honesty Node scripts 通过语法检查", () => {
  for (const script of [assessCodeScript, assessTestsScript]) {
    const result = spawnSync(process.execPath, ["--check", script], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, result.stderr);
  }
});

test("assess-code.mjs 对不存在目标返回失败", () => {
  const result = spawnSync(process.execPath, [assessCodeScript, "missing-target"], {
    cwd: pluginRoot,
    encoding: "utf-8",
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Target 'missing-target' does not exist/);
});

test("assess-code.mjs 能扫描目标并报告 TODO", () => {
  const root = mkdtempSync(join(tmpdir(), "testing-code-assess-"));
  mkdirSync(join(root, "src"), { recursive: true });
  mkdirSync(join(root, "tests"), { recursive: true });
  writeFileSync(join(root, "package.json"), '{"scripts":{"test":"node --test"}}\n', "utf-8");
  writeFileSync(join(root, "src", "sample.js"), "function work() { /* TODO fix */ return null; }\n", "utf-8");

  try {
    const result = spawnSync(process.execPath, [assessCodeScript, join(root, "src")], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /CORRECTNESS CHECK/);
    assert.match(result.stdout, /Found TODO\/FIXME\/BUG\/HACK comments/);
    assert.match(result.stdout, /Test directory exists/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("assess-tests.mjs 对不存在测试目录返回失败", () => {
  const result = spawnSync(process.execPath, [assessTestsScript, "missing-tests"], {
    cwd: pluginRoot,
    encoding: "utf-8",
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /Test directory 'missing-tests' doesn't exist/);
});

test("assess-tests.mjs 能扫描测试目录并跳过无 package 项目的运行检查", () => {
  const root = mkdtempSync(join(tmpdir(), "testing-test-assess-"));
  mkdirSync(join(root, "tests"), { recursive: true });
  writeFileSync(
    join(root, "tests", "sample.test.js"),
    "test('handles null empty boundary', () => {});\n",
    "utf-8",
  );

  try {
    const result = spawnSync(process.execPath, [assessTestsScript, join(root, "tests")], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, /EDGE CASE CHECK/);
    assert.match(result.stdout, /MICHELIN STAR: Found 3 edge case patterns/);
    assert.match(result.stdout, /No package.json found/);
    assert.match(result.stdout, /FINAL VERDICT/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
