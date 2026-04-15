import test from "node:test";
import assert from "node:assert/strict";

import { run } from "../hooks/pre-tool-use/bash/git-destructive-command-guard.mjs";

function payload(command) {
  return { tool_input: { command } };
}

// ── reset ──

test("拦截 git reset --hard", async () => {
  const result = await run(payload("git reset --hard HEAD~1"));
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /reset --hard/);
});

test("放行 git reset（无 --hard）", async () => {
  assert.equal(await run(payload("git reset HEAD~1")), null);
});

// ── checkout ──

test("拦截 git checkout -- .", async () => {
  const result = await run(payload("git checkout -- ."));
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /checkout -- \./);
});

test("放行 git checkout -- src/app.js", async () => {
  assert.equal(await run(payload("git checkout -- src/app.js")), null);
});

// ── restore ──

test("拦截 git restore --source=HEAD", async () => {
  const result = await run(payload("git restore --source=HEAD src/app.js"));
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /restore --source=HEAD/);
});

test("放行普通 git restore --staged", async () => {
  assert.equal(await run(payload("git restore --staged src/app.js")), null);
});

// ── clean ──

test("拦截 git clean -fd", async () => {
  const result = await run(payload("git clean -fd"));
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /git clean/);
});

test("拦截 git clean -xf", async () => {
  const result = await run(payload("git clean -xf"));
  assert.equal(result?.decision, "block");
});

test("放行 git clean -n（dry run）", async () => {
  assert.equal(await run(payload("git clean -n")), null);
});

// ── push --force ──

test("拦截 git push --force", async () => {
  const result = await run(payload("git push --force origin main"));
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /push --force/);
});

test("拦截 git push -f", async () => {
  const result = await run(payload("git push -f origin main"));
  assert.equal(result?.decision, "block");
});

test("放行 git push --force-with-lease", async () => {
  assert.equal(await run(payload("git push --force-with-lease origin main")), null);
});

test("放行普通 git push", async () => {
  assert.equal(await run(payload("git push origin main")), null);
});

// ── branch -D ──

test("拦截 git branch -D", async () => {
  const result = await run(payload("git branch -D feature/old"));
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /branch -D/);
});

test("放行 git branch -d（小写）", async () => {
  assert.equal(await run(payload("git branch -d feature/merged")), null);
});

// ── stash drop/clear ──

test("拦截 git stash drop", async () => {
  const result = await run(payload("git stash drop stash@{0}"));
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /stash drop/);
});

test("拦截 git stash clear", async () => {
  const result = await run(payload("git stash clear"));
  assert.equal(result?.decision, "block");
});

test("放行 git stash list", async () => {
  assert.equal(await run(payload("git stash list")), null);
});

// ── 非 git 命令 ──

test("放行非 git 命令", async () => {
  assert.equal(await run(payload("ls -la")), null);
});
