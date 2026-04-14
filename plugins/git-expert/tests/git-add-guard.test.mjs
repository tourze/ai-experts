import test from "node:test";
import assert from "node:assert/strict";
import { run } from "../hooks/pre-tool-use/bash/git-add-guard.mjs";

function payload(command) {
  return { tool_input: { command } };
}

test("拦截无路径的 git add -A", async () => {
  const result = await run(payload("git add -A"));
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /git add -A/);
});

test("允许带显式路径的 git add -A", async () => {
  const result = await run(payload("git add -A package.json"));
  assert.equal(result, null);
});

test("拦截 git add .", async () => {
  const result = await run(payload("git add ."));
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /git add \./);
});
