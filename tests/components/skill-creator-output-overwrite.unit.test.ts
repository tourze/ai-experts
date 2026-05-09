import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
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
  });

  test("refuses existing HTML, JSON, and Markdown report outputs unless overwrite is explicit", () => {
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
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
