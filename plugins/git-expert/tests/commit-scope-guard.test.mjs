import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { run } from "../hooks/pre-tool-use/bash/commit-scope-guard.mjs";

function createRepo() {
  const dir = mkdtempSync(join(tmpdir(), "git-expert-scope-"));
  execFileSync("git", ["init"], { cwd: dir, stdio: "ignore" });
  return dir;
}

function payload(command, cwd) {
  return { tool_input: { command }, cwd };
}

function stageFile(repo, relativePath, content) {
  const filePath = join(repo, relativePath);
  mkdirSync(join(filePath, ".."), { recursive: true });
  writeFileSync(filePath, content, "utf-8");
  execFileSync("git", ["add", relativePath], { cwd: repo, stdio: "ignore" });
}

test("同时触及多个 monorepo 包目录时提示拆分提交", async () => {
  const repo = createRepo();

  try {
    stageFile(repo, "plugins/git-expert/README.md", "a\n");
    stageFile(repo, "plugins/coding-expert/README.md", "b\n");

    const result = await run(payload('git commit -m "feat(repo): update hooks"', repo));
    assert.equal(result?.decision, "report");
    assert.match(result?.reason ?? "", /多个包\/项目目录/);
    assert.match(result?.reason ?? "", /plugins\/coding-expert/);
    assert.match(result?.reason ?? "", /plugins\/git-expert/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test("单个包目录内的小提交不触发 monorepo 扩散提示", async () => {
  const repo = createRepo();

  try {
    stageFile(repo, "plugins/git-expert/README.md", "a\n");
    stageFile(repo, "plugins/git-expert/hooks/guard.mjs", "b\n");

    const result = await run(payload('git commit -m "feat(repo): add guard"', repo));
    assert.equal(result, null);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
