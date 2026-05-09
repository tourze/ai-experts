import { describe, expect, test } from "vitest";
import { parseArgs as parseAppLauncherArgs } from "../../src/components/procedures/sources/android-device-automation/app_launcher.ts";
import { parseArgs as parseDiagnoseArgs } from "../../src/components/procedures/sources/android-device-automation/diagnose_app.ts";
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

  test("keeps diagnose logcat preservation as the default", () => {
    expect(parseDiagnoseArgs(["--package", "com.example.app"])).toMatchObject({
      packageName: "com.example.app",
      clearLogcat: false,
      forceStop: false,
      yes: false,
    });
    expect(parseDiagnoseArgs(["--package", "com.example.app", "--clear-logcat", "--force-stop", "--yes"]))
      .toMatchObject({
        clearLogcat: true,
        forceStop: true,
        yes: true,
      });
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
