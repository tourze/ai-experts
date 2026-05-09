import { describe, expect, test } from "vitest";
import { parseArgs as parseAppLauncherArgs } from "../../src/components/procedures/sources/android-device-automation/app_launcher.ts";
import { parseArgs as parseEmulatorManageArgs } from "../../src/components/procedures/sources/android-device-automation/emulator_manage.ts";

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
});
