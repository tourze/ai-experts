import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  parseArgs as parseAccessibilityArgs,
} from "../../src/components/procedures/sources/ios-simulator-skill/accessibility_audit.ts";
import {
  parseArgs as parseAppStateArgs,
  plannedAppStateCaptureDir,
} from "../../src/components/procedures/sources/ios-simulator-skill/app_state_capture.ts";
import {
  parseArgs as parseLogMonitorArgs,
  plannedLogOutputFiles,
} from "../../src/components/procedures/sources/ios-simulator-skill/log_monitor.ts";
import {
  parseArgs as parseTestRecorderArgs,
  plannedTestRecorderOutputDir,
} from "../../src/components/procedures/sources/ios-simulator-skill/test_recorder.ts";
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

    expect(parseAppStateArgs(["--output", "state"])).toMatchObject({
      output: "state",
      overwrite: false,
    });
    expect(parseAppStateArgs(["--output", "state", "--overwrite"]))
      .toMatchObject({
        output: "state",
        overwrite: true,
      });

    expect(parseLogMonitorArgs(["--output", "logs"])).toMatchObject({
      output: "logs",
      overwrite: false,
    });
    expect(parseLogMonitorArgs(["--output", "logs", "--overwrite"]))
      .toMatchObject({
        output: "logs",
        overwrite: true,
      });

    expect(parseTestRecorderArgs(["--test-name", "login", "--output", "artifacts"]))
      .toMatchObject({
        output: "artifacts",
        overwrite: false,
      });
    expect(parseTestRecorderArgs(["--test-name", "login", "--output", "artifacts", "--overwrite"]))
      .toMatchObject({
        output: "artifacts",
        overwrite: true,
      });
  });

  test("refuses existing iOS simulator outputs unless overwrite is explicit", () => {
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

      const now = new Date("2026-05-10T08:00:00.000Z");
      const appStateDir = plannedAppStateCaptureDir(workDir, now);
      mkdirSync(appStateDir, { recursive: true });
      expect(() => assertOutputWritable(appStateDir)).toThrow(/output file already exists/);

      const [logFile, logSummary] = plannedLogOutputFiles(
        workDir,
        "com.example.app",
        now,
      );
      writeFileSync(logSummary, "keep-log-summary\n", "utf8");
      expect(() => assertOutputFilesWritable([logFile, logSummary]))
        .toThrow(/output file already exists/);

      const recorderDir = plannedTestRecorderOutputDir(
        workDir,
        "Login Flow",
        now,
      );
      mkdirSync(recorderDir, { recursive: true });
      expect(() => assertOutputWritable(recorderDir)).toThrow(/output file already exists/);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
