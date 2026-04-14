import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { run } from "../hooks/pre-tool-use/bash/partial-staging-guard.mjs";

function createRepo() {
  const dir = mkdtempSync(join(tmpdir(), "git-expert-partial-"));
  execFileSync("git", ["init"], { cwd: dir, stdio: "ignore" });
  return dir;
}

function payload(command, cwd) {
  return { tool_input: { command }, cwd };
}

test("同一文件同时存在 staged 与 unstaged 改动时给出提醒", async () => {
  const repo = createRepo();
  const file = join(repo, "src", "app.txt");

  mkdirSync(join(repo, "src"), { recursive: true });
  writeFileSync(file, "line-1\n", "utf-8");
  execFileSync("git", ["add", "src/app.txt"], { cwd: repo, stdio: "ignore" });
  writeFileSync(file, "line-1\nline-2\n", "utf-8");

  try {
    const result = await run(payload('git commit -m "feat(repo): add app file"', repo));
    assert.equal(result?.decision, "report");
    assert.match(result?.reason ?? "", /staged 与 unstaged/);
    assert.match(result?.reason ?? "", /src\/app\.txt/);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test("没有重叠文件时不提醒 partial staging", async () => {
  const repo = createRepo();

  try {
    mkdirSync(join(repo, "src"), { recursive: true });
    writeFileSync(join(repo, "src", "app.txt"), "line-1\n", "utf-8");
    execFileSync("git", ["add", "src/app.txt"], { cwd: repo, stdio: "ignore" });

    const result = await run(payload('git commit -m "feat(repo): add app file"', repo));
    assert.equal(result, null);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
