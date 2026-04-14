import test from "node:test";
import assert from "node:assert/strict";

import { run } from "../hooks/pre-tool-use/bash/git-destructive-command-guard.mjs";

function payload(command) {
  return { tool_input: { command } };
}

test("拦截 git reset --hard", async () => {
  const result = await run(payload("git reset --hard HEAD~1"));
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /reset --hard/);
});

test("拦截 git checkout -- .", async () => {
  const result = await run(payload("git checkout -- ."));
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /checkout -- \./);
});

test("拦截 git restore --source=HEAD", async () => {
  const result = await run(payload("git restore --source=HEAD src/app.js"));
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /restore --source=HEAD/);
});

test("放行普通 git restore --staged", async () => {
  const result = await run(payload("git restore --staged src/app.js"));
  assert.equal(result, null);
});
