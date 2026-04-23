import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { run } from "../hooks/pre-tool-use/bash/git-stale-lock-guard.mjs";

function createRepo() {
  const dir = mkdtempSync(join(tmpdir(), "git-expert-lock-"));
  execFileSync("git", ["init"], { cwd: dir, stdio: "ignore" });
  mkdirSync(join(dir, "src"), { recursive: true });
  return dir;
}

function payload(command, cwd) {
  return { tool_input: { command }, cwd };
}

test("清理陈旧的 .git/index.lock", async () => {
  const repo = createRepo();
  const lockPath = join(repo, ".git", "index.lock");
  writeFileSync(lockPath, "", "utf-8");

  const staleAt = new Date(Date.now() - 10 * 60 * 1000);
  utimesSync(lockPath, staleAt, staleAt);

  try {
    const result = await run(payload('git commit -m "feat(repo): add sample"', repo));
    assert.equal(result?.decision, "report");
    assert.match(result?.reason ?? "", /已自动清理 stale 的 \.git\/index\.lock/);
    assert.equal(existsSync(lockPath), false);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test("新鲜但无持有进程的 lock 自动清理（进程已崩溃场景）", async () => {
  const repo = createRepo();
  const lockPath = join(repo, ".git", "index.lock");
  writeFileSync(lockPath, "", "utf-8");

  try {
    const result = await run(payload('git commit -m "feat(repo): add sample"', repo));
    assert.equal(result?.decision, "report");
    assert.match(result?.reason ?? "", /已自动清理 stale 的 \.git\/index\.lock/);
    assert.match(result?.reason ?? "", /未找到持有进程/);
    assert.equal(existsSync(lockPath), false);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});

test("lock 被当前进程持有时阻断", async () => {
  const repo = createRepo();
  const lockPath = join(repo, ".git", "index.lock");
  // 写入当前进程 PID 模拟 git 正在运行
  writeFileSync(lockPath, `${process.pid}\n`, "utf-8");

  try {
    const result = await run(payload('git commit -m "feat(repo): add sample"', repo));
    assert.equal(result?.decision, "block");
    assert.match(result?.reason ?? "", /已被占用/);
    assert.equal(existsSync(lockPath), true);
  } finally {
    rmSync(repo, { recursive: true, force: true });
  }
});
