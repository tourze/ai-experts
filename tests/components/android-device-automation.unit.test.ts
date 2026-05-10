import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { parseArgs as parseAppLauncherArgs } from "../../src/components/procedures/sources/android-device-automation/app_launcher.ts";
import { parseArgs as parseBuildAndTestArgs } from "../../src/components/procedures/sources/android-device-automation/build_and_test.ts";
import {
  assertOutputFilesWritable as assertDiagnoseOutputFilesWritable,
  parseArgs as parseDiagnoseArgs,
  plannedDiagnosisOutputFiles,
} from "../../src/components/procedures/sources/android-device-automation/diagnose_app.ts";
import { parseArgs as parseEmulatorManageArgs } from "../../src/components/procedures/sources/android-device-automation/emulator_manage.ts";
import { parseArgs as parseLogMonitorArgs } from "../../src/components/procedures/sources/android-device-automation/log_monitor.ts";

describe("android device automation procedures", () => {
  test("tracks explicit --yes state for app uninstall", () => {
    expect(parseAppLauncherArgs(["--uninstall", "com.example.app"])).toMatchObject({
      uninstall: "com.example.app",
      yes: false,
    });
    expect(parseAppLauncherArgs(["--uninstall", "com.example.app", "--yes"])).toMatchObject({
      uninstall: "com.example.app",
      yes: true,
    });
  });

  test("tracks explicit --yes state for emulator shutdown", () => {
    expect(parseEmulatorManageArgs(["--shutdown", "emulator-5554"])).toMatchObject({
      shutdown: "emulator-5554",
      yes: false,
    });
    expect(parseEmulatorManageArgs(["--shutdown", "emulator-5554", "--yes"])).toMatchObject({
      shutdown: "emulator-5554",
      yes: true,
    });
  });

  test("rejects reserved JSON flags that do not produce structured output", () => {
    expect(() => parseAppLauncherArgs(["--json"])).toThrow(/unrecognized argument: --json/);
    expect(() => parseBuildAndTestArgs(["--json"])).toThrow(/unrecognized argument: --json/);
    expect(() => parseEmulatorManageArgs(["--json"])).toThrow(/unrecognized argument: --json/);
  });

  test("keeps diagnose logcat preservation as the default", () => {
    expect(parseDiagnoseArgs(["--package", "com.example.app"])).toMatchObject({
      packageName: "com.example.app",
      clearLogcat: false,
      forceStop: false,
      overwrite: false,
      yes: false,
    });
    expect(parseDiagnoseArgs(["--package", "com.example.app", "--clear-logcat", "--force-stop", "--yes", "--overwrite"]))
      .toMatchObject({
        clearLogcat: true,
        forceStop: true,
        overwrite: true,
        yes: true,
      });
  });

  test("refuses to overwrite existing diagnose output files by default", () => {
    const workDir = mkdtempSync(join(tmpdir(), "ai-experts-android-diagnose-"));
    try {
      const args = parseDiagnoseArgs([
        "--package",
        "com.example.app",
        "--out",
        workDir,
        "--grep",
        "ERROR",
        "--no-launch",
      ]);
      const plannedFiles = plannedDiagnosisOutputFiles(args, workDir);
      expect(plannedFiles).toContain(join(workDir, "summary.json"));
      expect(plannedFiles).toContain(join(workDir, "logcat-filtered.txt"));
      expect(plannedFiles).not.toContain(join(workDir, "launch.txt"));

      writeFileSync(join(workDir, "summary.json"), "keep\n", "utf8");
      expect(() => assertDiagnoseOutputFilesWritable(plannedFiles)).toThrow(/output file already exists/);
      expect(() => assertDiagnoseOutputFilesWritable(plannedFiles, true)).not.toThrow();
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });

  test("tracks explicit --yes state for logcat clearing", () => {
    expect(parseLogMonitorArgs(["--package", "com.example.app", "--clear"])).toMatchObject({
      clear: true,
      yes: false,
    });
    expect(parseLogMonitorArgs(["--package", "com.example.app", "--clear", "--yes"])).toMatchObject({
      clear: true,
      yes: true,
    });
  });
});
