import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "vitest";
import { main as collectDiffMain } from "../../src/components/procedures/sources/pre-landing-review/collect_diff.ts";
import { main as renderReportMain, renderReport } from "../../src/components/procedures/sources/pre-landing-review/render_report.ts";

async function captureMain(run: () => unknown): Promise<{ status: number; stdout: string; stderr: string }> {
    const originalStdoutWrite = process.stdout.write;
    const originalStderrWrite = process.stderr.write;
    const originalExitCode = process.exitCode;
    let stdout = "";
    let stderr = "";
    (process.stdout.write as any) = (chunk: any): boolean => {
        stdout += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
        return true;
    };
    (process.stderr.write as any) = (chunk: any): boolean => {
        stderr += Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk);
        return true;
    };
    try {
        process.exitCode = undefined;
        const result = await run();
        return { status: Number(result ?? process.exitCode ?? 0), stdout, stderr };
    }
    finally {
        process.stdout.write = originalStdoutWrite;
        process.stderr.write = originalStderrWrite;
        process.exitCode = originalExitCode;
    }
}

describe("renderReport", (): any => {
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
describe("CLI entrypoints", (): any => {
    it("render_report main 输出报告", async () => {
        const dir = mkdtempSync(join(tmpdir(), "pre-landing-render-"));
        const inputPath = join(dir, "findings.json");
        writeFileSync(inputPath, JSON.stringify({ verdict: "BLOCKED", blocking: [], informational: [] }));
        const result = await captureMain(() => renderReportMain(["--input", inputPath]));
        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /## 阻断项/);
        assert.match(result.stdout, /结论：BLOCKED/);
    });
    it("collect_diff main 输出 diff JSON", async () => {
        const dir = mkdtempSync(join(tmpdir(), "pre-landing-collect-"));
        const repoDir = join(dir, "repo");
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
        const output = await captureMain(() => collectDiffMain(["--base", "HEAD~1", "--cwd", repoDir]));
        assert.equal(output.status, 0, output.stderr);
        const result = JSON.parse(output.stdout);
        assert.equal(result.range, "HEAD~1...");
        assert.deepEqual(result.files, ["a.txt"]);
    });
});
