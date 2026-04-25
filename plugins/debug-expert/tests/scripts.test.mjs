import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve("plugins/debug-expert");
const script = `${root}/skills/debug-lldb/scripts/collect_stacks.mjs`;

function run(command, args) {
  return spawnSync(command, args, {
    cwd: resolve("."),
    encoding: "utf-8",
  });
}

test("Node 脚本通过语法检查", () => {
  const result = run(process.execPath, ["--check", script]);
  assert.equal(result.status, 0, result.stderr);
});

test("collect_stacks.mjs --help 输出帮助信息", () => {
  const result = run(process.execPath, [script, "--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /collect_stacks\.mjs --pid <pid>/);
});

test("collect_stacks.mjs 对缺失参数值给出明确报错", () => {
  const result = run(process.execPath, [script, "--pid"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing value for --pid/);
});

test("collect_stacks.mjs 拒绝非法 repeat", () => {
  const result = run(process.execPath, [script, "--pid", "12345", "--repeat", "oops"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--repeat must be an integer greater than or equal to 1/);
});
