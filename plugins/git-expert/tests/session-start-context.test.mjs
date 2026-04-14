import test from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

import { run } from "../hooks/session-start/git-workflow-context.mjs";

test("git-workflow-context 注入 Git 工作流纪律", async () => {
  const result = await run({ cwd: resolve(".") });
  assert.equal(result?.decision, "context");
  assert.match(result?.reason ?? "", /📌 Git 工作流/);
  assert.match(result?.reason ?? "", /共享工作区/);
  assert.match(result?.reason ?? "", /git worktree/);
  assert.match(result?.reason ?? "", /git status --short/);
  assert.match(result?.reason ?? "", /git diff --cached --stat/);
  assert.match(result?.reason ?? "", /git reset --hard/);
});

test("git-workflow-context 在非 git 目录不注入", async () => {
  const dir = mkdtempSync(join(tmpdir(), "git-expert-nonrepo-"));

  try {
    const result = await run({ cwd: dir });
    assert.equal(result, null);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
