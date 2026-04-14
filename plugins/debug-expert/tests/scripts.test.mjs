import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const root = resolve("plugins/debug-expert");
const script = `${root}/skills/debug-lldb/scripts/collect_stacks.sh`;

function run(command, args) {
  return spawnSync(command, args, {
    cwd: resolve("."),
    encoding: "utf-8",
  });
}

test("Shell 脚本通过 bash -n", () => {
  const result = run("bash", ["-n", script]);
  assert.equal(result.status, 0, result.stderr);
});

test("collect_stacks.sh --help 输出帮助信息", () => {
  const result = run("bash", [script, "--help"]);
  assert.equal(result.status, 0);
  assert.match(result.stdout, /collect_stacks\.sh --pid <pid>/);
});

test("collect_stacks.sh 对缺失参数值给出明确报错", () => {
  const result = run("bash", [script, "--pid"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing value for --pid/);
});

test("collect_stacks.sh 拒绝非法 repeat", () => {
  const result = run("bash", [script, "--pid", "12345", "--repeat", "oops"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /--repeat must be an integer greater than or equal to 1/);
});
