import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

test("hook dispatch 模板保持同步", () => {
  assert.doesNotThrow(() => {
    execFileSync(process.execPath, ["scripts/sync-hook-dispatch.mjs", "--check"], {
      encoding: "utf-8",
      stdio: "pipe",
    });
  });
});

test("trigger 审计报告能生成 hooks 与 skill 覆盖数据", () => {
  const output = execFileSync(process.execPath, [
    "scripts/trigger-audit-report.mjs",
    "--json",
    "--days",
    "365",
    "--top",
    "3",
  ], {
    encoding: "utf-8",
    stdio: "pipe",
  });
  const report = JSON.parse(output);

  assert.ok(report.hooks.dispatchFiles > 0, "应发现插件 dispatch 文件");
  assert.equal(
    report.hooks.telemetryReady,
    report.hooks.dispatchFiles,
    "所有 dispatch 都应包含遥测逻辑",
  );
  assert.ok(report.skills.total > 100, "应发现全仓 skill");
  assert.ok(report.skills.withEvals > 0, "应发现已有 skill 触发 eval");
  assert.ok(report.skills.evalCaseTotals.positive > 0, "应统计正向触发样例");
  assert.equal(typeof report.runtime.skillRuntime.entries, "number", "应输出 skill runtime 审计摘要");
});

test("hook telemetry 按工作区分桶并执行大小滚动", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "ai-experts-hook-telemetry-"));
  const dispatchPath = resolve("plugins/skill-expert/hooks/dispatch.mjs");
  const env = {
    ...process.env,
    AI_EXPERTS_HOOK_TELEMETRY_DIR: tempDir,
    AI_EXPERTS_HOOK_TELEMETRY_MAX_BYTES: "1",
    AI_EXPERTS_HOOK_TELEMETRY_MAX_FILES: "2",
  };

  try {
    for (let index = 0; index < 4; index += 1) {
      const result = spawnSync(process.execPath, [dispatchPath, "session-start"], {
        cwd: resolve("."),
        encoding: "utf-8",
        env,
        input: "{not-json",
      });
      assert.equal(result.status, 0);
    }

    const workspaceRoot = join(tempDir, "workspaces");
    const buckets = readdirSync(workspaceRoot);
    assert.equal(buckets.length, 1, "同一 cwd 应写入同一个工作区桶");

    const files = readdirSync(join(workspaceRoot, buckets[0]))
      .filter((name) => name.startsWith("decisions.jsonl"));
    assert.ok(files.includes("decisions.jsonl"), "应保留当前 decisions.jsonl");
    assert.ok(files.length <= 2, "滚动后单桶日志文件数量应受上限约束");
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
