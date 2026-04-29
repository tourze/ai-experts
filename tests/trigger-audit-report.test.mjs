import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

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

  assert.ok(report.hooks.hookModules > 0, "应发现 hook 模块");
  assert.ok(report.skills.total > 100, "应发现全仓 skill");
  assert.ok(report.skills.withEvals > 0, "应发现已有 skill 触发 eval");
  assert.ok(report.skills.evalCaseTotals.positive > 0, "应统计正向触发样例");
  assert.equal(typeof report.runtime.skillRuntime.entries, "number", "应输出 skill runtime 审计摘要");
});

test("hook telemetry 按工作区分桶并执行大小滚动", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "ai-experts-hook-telemetry-"));
  const dispatchPath = resolve("hooks/dispatch.mjs");
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

test("trigger 审计报告忽略 legacy 根文件遥测", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "ai-experts-legacy-telemetry-"));
  writeFileSync(
    join(tempDir, "decisions.jsonl"),
    `${JSON.stringify({
      ts: Date.now(),
      plugin: "coding-expert",
      hook: "legacy-hook",
      decision: "report",
    })}\n`,
    "utf-8",
  );

  try {
    const output = execFileSync(process.execPath, [
      "scripts/trigger-audit-report.mjs",
      "--json",
      "--days",
      "365",
    ], {
      encoding: "utf-8",
      stdio: "pipe",
      env: {
        ...process.env,
        AI_EXPERTS_HOOK_TELEMETRY_DIR: tempDir,
      },
    });
    const report = JSON.parse(output);
    assert.equal(report.runtime.exists, false, "应忽略 legacy 根文件并返回无可用遥测");
    assert.equal(report.runtime.entries, 0);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("trigger 审计报告识别 skill usage audit 只产生 skip 的数据质量问题", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "ai-experts-skill-audit-skip-"));
  const telemetryFile = join(tempDir, "decisions.jsonl");
  writeFileSync(
    telemetryFile,
    `${JSON.stringify({
      ts: Date.now(),
      plugin: "skill-expert",
      hook: "skill-usage-audit.mjs",
      decision: "skip",
      event: "stop",
    })}\n`,
    "utf-8",
  );

  try {
    const output = execFileSync(process.execPath, [
      "scripts/trigger-audit-report.mjs",
      "--json",
      "--telemetry-file",
      telemetryFile,
      "--days",
      "365",
    ], {
      encoding: "utf-8",
      stdio: "pipe",
    });
    const report = JSON.parse(output);
    assert.equal(report.runtime.skillRuntime.entries, 0);
    assert.equal(report.runtime.skillRuntime.skillAuditSkips, 1);
    assert.match(report.recommendations.join("\n"), /只产生 skip 记录/);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("trigger 审计报告区分主动热点和 skip 覆盖热点", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "ai-experts-active-telemetry-"));
  const telemetryFile = join(tempDir, "decisions.jsonl");
  const now = Date.now();
  const lines = [
    ...Array.from({ length: 4 }, () => ({
      ts: now,
      plugin: "coding-expert",
      hook: "skip-heavy.mjs",
      decision: "skip",
    })),
    { ts: now, plugin: "coding-expert", hook: "active-hook.mjs", decision: "report" },
    { ts: now, plugin: "coding-expert", hook: "active-hook.mjs", decision: "report" },
    { ts: now, plugin: "coding-expert", hook: "active-hook.mjs", decision: "block" },
  ];
  writeFileSync(telemetryFile, `${lines.map((entry) => JSON.stringify(entry)).join("\n")}\n`, "utf-8");

  try {
    const output = execFileSync(process.execPath, [
      "scripts/trigger-audit-report.mjs",
      "--json",
      "--telemetry-file",
      telemetryFile,
      "--days",
      "365",
      "--top",
      "3",
    ], {
      encoding: "utf-8",
      stdio: "pipe",
    });
    const report = JSON.parse(output);

    assert.deepEqual(report.runtime.hotHooks, [{ hook: "coding-expert/active-hook.mjs", count: 3 }]);
    assert.deepEqual(report.runtime.highSkipHooks[0], { hook: "coding-expert/skip-heavy.mjs", count: 4 });
    assert.equal(report.runtime.byDecision.skip, 4);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("hook telemetry 报告忽略 legacy 根文件遥测", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "ai-experts-legacy-telemetry-"));
  writeFileSync(
    join(tempDir, "decisions.jsonl"),
    `${JSON.stringify({
      ts: Date.now(),
      plugin: "coding-expert",
      hook: "legacy-hook",
      decision: "report",
    })}\n`,
    "utf-8",
  );

  try {
    const output = execFileSync(process.execPath, [
      "scripts/hook-telemetry-report.mjs",
      "--days",
      "365",
    ], {
      encoding: "utf-8",
      stdio: "pipe",
      env: {
        ...process.env,
        AI_EXPERTS_HOOK_TELEMETRY_DIR: tempDir,
      },
    });
    assert.match(output, /暂无遥测数据/);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});

test("hook telemetry 报告的 FP 信号忽略 skip 重复", () => {
  const tempDir = mkdtempSync(join(tmpdir(), "ai-experts-hook-fp-skip-"));
  const telemetryFile = join(tempDir, "decisions.jsonl");
  const now = Date.now();
  const target = "git status --short";
  const lines = [
    { ts: now, plugin: "coding-expert", hook: "cat-write-guard.mjs", decision: "block", file: target },
    ...Array.from({ length: 5 }, () => ({
      ts: now,
      plugin: "coding-expert",
      hook: "cat-write-guard.mjs",
      decision: "skip",
      file: target,
    })),
  ];
  writeFileSync(telemetryFile, `${lines.map((entry) => JSON.stringify(entry)).join("\n")}\n`, "utf-8");

  try {
    const output = execFileSync(process.execPath, [
      "scripts/hook-telemetry-report.mjs",
      "--telemetry-file",
      telemetryFile,
      "--days",
      "365",
    ], {
      encoding: "utf-8",
      stdio: "pipe",
    });

    assert.match(output, /Active Target/);
    assert.match(output, /git status --short\(1\)/);
    assert.doesNotMatch(output, /FP\/噪音可疑信号/);
  } finally {
    rmSync(tempDir, { recursive: true, force: true });
  }
});
