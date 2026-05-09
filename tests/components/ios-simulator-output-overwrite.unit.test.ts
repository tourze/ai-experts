import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  parseArgs as parseAccessibilityArgs,
} from "../../src/components/procedures/sources/ios-simulator-skill/accessibility_audit.ts";
import {
  parseArgs as parseVisualDiffArgs,
  plannedVisualDiffOutputFiles,
} from "../../src/components/procedures/sources/ios-simulator-skill/visual_diff.ts";
import {
  assertOutputFilesWritable,
  assertOutputWritable,
} from "../../src/components/procedures/sources/ios-simulator-skill/output_guard.ts";

describe("ios simulator output overwrite guards", () => {
  test("tracks explicit overwrite state for output-producing procedures", () => {
    expect(parseAccessibilityArgs(["--output", "audit.json"])).toMatchObject({
      output: "audit.json",
      overwrite: false,
    });
    expect(parseAccessibilityArgs(["--output", "audit.json", "--overwrite"]))
      .toMatchObject({
        output: "audit.json",
        overwrite: true,
      });

    expect(parseVisualDiffArgs(["baseline.png", "current.png", "--output", "diffs"]))
      .toMatchObject({
        output: "diffs",
        overwrite: false,
      });
    expect(parseVisualDiffArgs(["baseline.png", "current.png", "--output", "diffs", "--overwrite"]))
      .toMatchObject({
        output: "diffs",
        overwrite: true,
      });
  });

  test("refuses existing accessibility and visual diff outputs unless overwrite is explicit", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ai-experts-ios-output-"));
    try {
      const auditFile = join(workDir, "audit.json");
      writeFileSync(auditFile, "keep\n", "utf8");

      expect(() => assertOutputWritable(auditFile)).toThrow(/output file already exists/);
      expect(() => assertOutputWritable(auditFile, true)).not.toThrow();

      const plannedFiles = plannedVisualDiffOutputFiles(workDir);
      expect(plannedFiles).toEqual([
        join(workDir, "diff.png"),
        join(workDir, "side-by-side.png"),
        join(workDir, "diff-report.json"),
      ]);

      writeFileSync(join(workDir, "diff-report.json"), "keep\n", "utf8");
      expect(() => assertOutputFilesWritable(plannedFiles)).toThrow(/output file already exists/);
      expect(() => assertOutputFilesWritable(plannedFiles, true)).not.toThrow();
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
