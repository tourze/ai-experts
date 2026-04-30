import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderReport } from "./render_report.mjs";

const scriptDir = dirname(fileURLToPath(import.meta.url));

describe("renderReport", () => {
  it("阻断项段含文件:行号、问题、风险、用户三选一（默认）", () => {
    const md = renderReport({
      verdict: "BLOCKED",
      blocking: [
        { id: "B1", severity: "高风险", file: "src/order/service.ts", line: 88, issue: "事务内调外部支付", risk: "锁等待放大" },
      ],
      informational: [],
    });
    assert.match(md, /## 阻断项/);
    assert.match(md, /\[高风险\] `src\/order\/service\.ts:88`/);
    assert.match(md, /问题：事务内调外部支付/);
    assert.match(md, /风险：锁等待放大/);
    assert.match(md, /立即修复 \/ 确认风险 \/ 误报/);
  });

  it("无阻断项时显示「无」", () => {
    const md = renderReport({ verdict: "CLEAR TO LAND", blocking: [], informational: [] });
    assert.match(md, /## 阻断项\n\n无。/);
  });

  it("门禁结论包含 verdict、计数、放行条件", () => {
    const md = renderReport({
      verdict: "BLOCKED",
      blocking: [{ id: "B1", file: "a", issue: "x", risk: "y" }],
      informational: [{ id: "I1", file: "b", issue: "z" }],
      release_conditions: ["拆事务", "补幂等测试"],
    });
    assert.match(md, /结论：BLOCKED/);
    assert.match(md, /阻断项：1/);
    assert.match(md, /建议项：1/);
    assert.match(md, /拆事务/);
    assert.match(md, /补幂等测试/);
  });

  it("file 缺省时位置占位为「未提供文件」", () => {
    const md = renderReport({
      verdict: "BLOCKED",
      blocking: [{ id: "B1", issue: "i", risk: "r" }],
      informational: [],
    });
    assert.match(md, /\(未提供文件\)/);
  });

  it("自定义 options 覆盖默认三选一", () => {
    const md = renderReport({
      verdict: "BLOCKED",
      blocking: [{ id: "B1", file: "a", issue: "i", risk: "r", options: ["回滚", "热修"] }],
      informational: [],
    });
    assert.match(md, /回滚 \/ 热修/);
    assert.doesNotMatch(md, /立即修复/);
  });

  it("非对象输入抛错", () => {
    assert.throws(() => renderReport(null), /must be an object/);
  });
});

describe("CLI entrypoints", () => {
  it("render_report.mjs 通过 symlink 执行时输出报告", () => {
    const dir = mkdtempSync(join(tmpdir(), "pre-landing-render-"));
    const inputPath = join(dir, "findings.json");
    const linkPath = join(dir, "render_report.mjs");
    writeFileSync(inputPath, JSON.stringify({ verdict: "BLOCKED", blocking: [], informational: [] }));
    symlinkSync(join(scriptDir, "render_report.mjs"), linkPath);

    const output = execFileSync(process.execPath, [linkPath, "--input", inputPath], { encoding: "utf-8" });

    assert.match(output, /## 阻断项/);
    assert.match(output, /结论：BLOCKED/);
  });

  it("collect_diff.mjs 通过 symlink 执行时输出 diff JSON", () => {
    const dir = mkdtempSync(join(tmpdir(), "pre-landing-collect-"));
    const repoDir = join(dir, "repo");
    const linkPath = join(dir, "collect_diff.mjs");
    symlinkSync(join(scriptDir, "collect_diff.mjs"), linkPath);

    execFileSync("git", ["init", repoDir], { encoding: "utf-8" });
    writeFileSync(join(repoDir, "a.txt"), "old\n");
    execFileSync("git", ["add", "a.txt"], { cwd: repoDir, encoding: "utf-8" });
    execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "init"], {
      cwd: repoDir,
      encoding: "utf-8",
    });
    writeFileSync(join(repoDir, "a.txt"), "new\n");
    execFileSync("git", ["add", "a.txt"], { cwd: repoDir, encoding: "utf-8" });
    execFileSync("git", ["-c", "user.name=Test", "-c", "user.email=test@example.com", "commit", "-m", "change"], {
      cwd: repoDir,
      encoding: "utf-8",
    });

    const output = execFileSync(process.execPath, [linkPath, "--base", "HEAD~1", "--cwd", repoDir], { encoding: "utf-8" });
    const result = JSON.parse(output);

    assert.equal(result.range, "HEAD~1...");
    assert.deepEqual(result.files, ["a.txt"]);
  });
});
