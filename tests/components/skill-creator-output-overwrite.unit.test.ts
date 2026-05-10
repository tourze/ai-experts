import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  parseArgs as parseAggregateArgs,
  plannedBenchmarkOutputFiles,
} from "../../src/components/procedures/sources/skill-creator/aggregate_benchmark.ts";
import {
  parseArgs as parseGenerateReportArgs,
  main as generateReportMain,
} from "../../src/components/procedures/sources/skill-creator/generate_report.ts";
import {
  main as generateReviewMain,
  parseCliArgs as parseGenerateReviewArgs,
} from "../../src/components/procedures/sources/skill-creator/generate_review.ts";
import {
  packageSkill,
  parseArgs as parsePackageSkillArgs,
} from "../../src/components/procedures/sources/skill-creator/package_skill.ts";
import { parseArgs as parseRunLoopArgs } from "../../src/components/procedures/sources/skill-creator/run_loop.ts";
import {
  assertOutputFilesWritable,
  assertOutputWritable,
} from "../../src/components/procedures/sources/skill-creator/output_guard.ts";

describe("skill creator output overwrite guards", () => {
  test("tracks explicit overwrite state for report generators", () => {
    expect(parseGenerateReportArgs(["results.json", "-o", "report.html"]))
      .toMatchObject({
        output: "report.html",
        overwrite: false,
      });
    expect(parseGenerateReportArgs(["results.json", "-o", "report.html", "--overwrite"]))
      .toMatchObject({
        output: "report.html",
        overwrite: true,
      });

    expect(parseAggregateArgs(["benchmark-dir", "--output", "benchmark.json"]))
      .toMatchObject({
        output: "benchmark.json",
        overwrite: false,
      });
    expect(parseAggregateArgs(["benchmark-dir", "--output", "benchmark.json", "--overwrite"]))
      .toMatchObject({
        output: "benchmark.json",
        overwrite: true,
      });

    const workspace = mkdtempSync(join(tmpdir(), "ai-experts-skill-creator-review-"));
    try {
      const runDir = join(workspace, "runs", "case-1");
      mkdirSync(join(runDir, "outputs"), { recursive: true });
      writeFileSync(join(runDir, "outputs", "answer.txt"), "ok\n", "utf8");
      expect(parseGenerateReviewArgs([workspace, "--static", "review.html"]))
        .toMatchObject({
          workspace,
          staticOutputPath: expect.stringContaining("review.html"),
          overwrite: false,
        });
      expect(parseGenerateReviewArgs([workspace, "--static", "review.html", "--overwrite"]))
        .toMatchObject({
          overwrite: true,
        });
      expect(parseGenerateReviewArgs([
        workspace,
        "--previous-workspace",
        workspace,
        "--benchmark",
        join(workspace, "benchmark.json"),
      ])).toMatchObject({
        previous: {},
        benchmarkPath: join(workspace, "benchmark.json"),
      });
    } finally {
      rmSync(workspace, { recursive: true, force: true });
    }

    expect(parsePackageSkillArgs(["skills/demo", "dist"])).toMatchObject({
      skillPath: "skills/demo",
      outputDir: "dist",
      overwrite: false,
    });
    expect(parsePackageSkillArgs(["skills/demo", "dist", "--overwrite"]))
      .toMatchObject({
        skillPath: "skills/demo",
        outputDir: "dist",
        overwrite: true,
      });

    expect(parseRunLoopArgs([
      "--eval-set",
      "evals/cases.yaml",
      "--skill-path",
      "skills/demo",
      "--model",
      "model",
      "--report",
      "report.html",
    ])).toMatchObject({
      report: "report.html",
      overwrite: false,
    });
    expect(parseRunLoopArgs([
      "--eval-set",
      "evals/cases.yaml",
      "--skill-path",
      "skills/demo",
      "--model",
      "model",
      "--report",
      "report.html",
      "--overwrite",
    ])).toMatchObject({
      report: "report.html",
      overwrite: true,
    });
  });

  test("refuses existing report outputs unless overwrite is explicit", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ai-experts-skill-creator-output-"));
    try {
      const outputHtml = join(workDir, "report.html");
      const resultsJson = join(workDir, "results.json");
      writeFileSync(resultsJson, JSON.stringify({ history: [] }), "utf8");
      writeFileSync(outputHtml, "keep\n", "utf8");

      expect(() => assertOutputWritable(outputHtml)).toThrow(/output file already exists/);
      expect(generateReportMain([resultsJson, "-o", outputHtml])).toBe(1);
      expect(readFileSync(outputHtml, "utf8")).toBe("keep\n");

      const benchmarkJson = join(workDir, "benchmark.json");
      const benchmarkMd = join(workDir, "benchmark.md");
      writeFileSync(benchmarkJson, "keep-json\n", "utf8");
      writeFileSync(benchmarkMd, "keep-md\n", "utf8");
      const plannedFiles = plannedBenchmarkOutputFiles(benchmarkJson);
      expect(plannedFiles).toEqual([benchmarkJson, benchmarkMd]);
      expect(() => assertOutputFilesWritable(plannedFiles)).toThrow(/output file already exists/);
      expect(() => assertOutputFilesWritable(plannedFiles, true)).not.toThrow();

      const extensionlessBenchmark = join(workDir, "benchmark");
      expect(plannedBenchmarkOutputFiles(extensionlessBenchmark)).toEqual([
        extensionlessBenchmark,
        `${extensionlessBenchmark}.md`,
      ]);

      const reviewWorkspace = join(workDir, "workspace");
      const reviewRunDir = join(reviewWorkspace, "runs", "case-1");
      const reviewHtml = join(workDir, "review.html");
      mkdirSync(join(reviewRunDir, "outputs"), { recursive: true });
      writeFileSync(join(reviewRunDir, "outputs", "answer.txt"), "ok\n", "utf8");
      writeFileSync(reviewHtml, "keep-review\n", "utf8");
      expect(() => generateReviewMain([reviewWorkspace, "--static", reviewHtml]))
        .toThrow(/output file already exists/);
      expect(readFileSync(reviewHtml, "utf8")).toBe("keep-review\n");
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  test("refuses existing .skill package output unless overwrite is explicit", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ai-experts-skill-creator-package-"));
    try {
      const skillDir = join(workDir, "demo-skill");
      const outputDir = join(workDir, "dist");
      mkdirSync(skillDir, { recursive: true });
      mkdirSync(outputDir, { recursive: true });
      writeFileSync(
        join(skillDir, "SKILL.md"),
        "---\nname: demo-skill\ndescription: Demo skill.\n---\n# Demo\n",
        "utf8",
      );
      const packagePath = join(outputDir, "demo-skill.skill");
      writeFileSync(packagePath, "keep-package\n", "utf8");

      expect(packageSkill(skillDir, outputDir)).toBeNull();
      expect(readFileSync(packagePath, "utf8")).toBe("keep-package\n");
      expect(packageSkill(skillDir, outputDir, true)).toBe(packagePath);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
