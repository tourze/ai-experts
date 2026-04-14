import test from "node:test";
import assert from "node:assert/strict";
import { run } from "../hooks/pre-tool-use/bash/commit-message-guard.mjs";

function payload(command) {
  return { tool_input: { command } };
}

test("拦截 git commit -am 的模糊 message", async () => {
  const result = await run(payload('git commit -am "fix"'));
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /过于模糊/);
});

test("放行 git commit -am 的合规 message", async () => {
  const result = await run(payload('git commit -am "fix(auth): 修复 token 刷新时序"'));
  assert.equal(result, null);
});

test("支持 --message 语法", async () => {
  const result = await run(payload('git commit --message="feat(cli): 添加 --json 输出"'));
  assert.equal(result, null);
});
