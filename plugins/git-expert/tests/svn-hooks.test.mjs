import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import { run as runBulkGuard } from "../hooks/pre-tool-use/bash/svn-bulk-operation-guard.mjs";
import { run as runMessageGuard } from "../hooks/pre-tool-use/bash/svn-commit-message-guard.mjs";

function payload(command, cwd = process.cwd()) {
  return { cwd, tool_input: { command } };
}

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "svn-expert-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("拦截 svn add .", async () => {
  const result = await runBulkGuard(payload("svn add ."));
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /svn add \./);
});

test("拦截 svn add --force", async () => {
  const result = await runBulkGuard(payload("svn add --force src"));
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /--force/);
});

test("允许带显式路径的 svn add", async () => {
  const result = await runBulkGuard(payload("svn add src/main.java"));
  assert.equal(result, null);
});

test("拦截无路径 svn commit", async () => {
  const result = await runBulkGuard(payload('svn commit -m "fix(auth): 修复 token 刷新"'));
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /未指定具体路径/);
});

test("拦截把 --depth 误当路径的 svn commit", async () => {
  const result = await runBulkGuard(payload('svn commit -m "fix(auth): 修复 token 刷新" --depth empty'));
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /未指定具体路径/);
});

test("允许路径在 -m 前面的 svn commit", async () => {
  const result = await runBulkGuard(payload('svn commit src/main.java -m "fix(auth): 修复 token 刷新"'));
  assert.equal(result, null);
});

test("允许 --message= 形式且路径在后面的 svn commit", async () => {
  const result = await runBulkGuard(payload('svn commit --message="fix(auth): 修复 token 刷新" src/main.java'));
  assert.equal(result, null);
});

test("拦截模糊提交信息", async () => {
  const result = await runMessageGuard(payload('svn commit src/main.java -m "fix"'));
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /过于模糊/);
});

test("对非 Conventional Commits 给出 report", async () => {
  const result = await runMessageGuard(payload('svn commit src/main.java -m "修复 token 过期问题并补充日志"'));
  assert.equal(result?.decision, "report");
  assert.match(result?.reason ?? "", /Conventional Commits/);
});

test("支持从 --file 读取提交信息", async () => {
  await withTempDir(async (dir) => {
    const messageFile = join(dir, "message.txt");
    writeFileSync(messageFile, "feat(auth): 添加 OAuth2 登录支持\n\n补充回调处理。", "utf8");

    const result = await runMessageGuard(
      payload(`cd ${dir} && svn commit src/main.java --file message.txt`, dir),
    );

    assert.equal(result, null);
  });
});
