import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import test from "node:test";

const script = resolve("plugins/ios-expert/skills/ios-simulator-skill/scripts/sim_health_check.mjs");
const scriptsDir = resolve("plugins/ios-expert/skills/ios-simulator-skill/scripts");

test("sim_health_check.mjs 通过语法检查", () => {
  const result = spawnSync(process.execPath, ["--check", script], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});

test("sim_health_check.mjs 输出帮助信息", () => {
  const result = spawnSync(process.execPath, [script, "--help"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /iOS Simulator Testing - Environment Health Check/);
  assert.match(result.stdout, /Usage: node scripts\/sim_health_check\.mjs/);
});

test("sim_health_check.mjs 缺少工具时返回失败", () => {
  const result = spawnSync(process.execPath, [script], {
    encoding: "utf8",
    env: { ...process.env, PATH: "" },
  });

  assert.equal(result.status, 1);
  assert.match(result.stdout, /iOS Simulator Testing - Environment Health Check/);
  assert.match(result.stdout, /Action required/);
});

test("simctl Node lifecycle scripts 通过语法检查", () => {
  for (const name of [
    "simctl_boot.mjs",
    "simctl_common.mjs",
    "simctl_create.mjs",
    "simctl_delete.mjs",
    "simctl_erase.mjs",
    "simctl_shutdown.mjs",
    "clipboard.mjs",
    "gesture.mjs",
    "interaction_common.mjs",
    "keyboard.mjs",
    "log_monitor.mjs",
    "app_launcher.mjs",
    "privacy_manager.mjs",
    "push_notification.mjs",
    "status_bar.mjs",
  ]) {
    const result = spawnSync(process.execPath, ["--check", resolve(scriptsDir, name)], { encoding: "utf8" });
    assert.equal(result.status, 0, `${name}: ${result.stderr}`);
  }
});

test("simctl Node lifecycle scripts 输出帮助信息", () => {
  for (const [name, pattern] of [
    ["simctl_boot.mjs", /Boot iOS simulators/],
    ["simctl_create.mjs", /Create iOS simulators/],
    ["simctl_delete.mjs", /Delete iOS simulators/],
    ["simctl_erase.mjs", /Erase iOS simulators/],
    ["simctl_shutdown.mjs", /Shutdown iOS simulators/],
    ["clipboard.mjs", /Copy text to iOS simulator clipboard/],
    ["gesture.mjs", /Perform gestures on iOS simulator/],
    ["keyboard.mjs", /Control keyboard and hardware buttons/],
    ["log_monitor.mjs", /Monitor and analyze iOS simulator logs/],
    ["app_launcher.mjs", /Control iOS app lifecycle/],
    ["privacy_manager.mjs", /Manage iOS app privacy and permissions/],
    ["push_notification.mjs", /Send simulated push notification/],
    ["status_bar.mjs", /Override iOS simulator status bar/],
  ]) {
    const result = spawnSync(process.execPath, [resolve(scriptsDir, name), "--help"], { encoding: "utf8" });
    assert.equal(result.status, 0, `${name}: ${result.stderr}`);
    assert.match(result.stdout, pattern);
  }
});

test("simctl Node helpers 保持解析和参数转换", async () => {
  const common = await import(resolve(scriptsDir, "simctl_common.mjs"));
  const boot = await import(resolve(scriptsDir, "simctl_boot.mjs"));
  const create = await import(resolve(scriptsDir, "simctl_create.mjs"));
  const deleteScript = await import(resolve(scriptsDir, "simctl_delete.mjs"));

  assert.deepEqual(common.buildSimctlCommand("launch", null, "com.example.app"), [
    "xcrun",
    "simctl",
    "launch",
    "booted",
    "com.example.app",
  ]);
  assert.equal(
    common.parseBootedDeviceUdid("    iPhone 16 Pro (A1B2C3D4-E5F6-7890-ABCD-EF1234567890) (Booted)\n"),
    "A1B2C3D4-E5F6-7890-ABCD-EF1234567890",
  );

  const simulators = common.parseSimulatorsFromList({
    devices: {
      "iOS 18.0": [
        { name: "iPhone 16 Pro", udid: "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE", state: "Booted" },
        { name: "iPad Air", udid: "11111111-2222-3333-4444-555555555555", state: "Shutdown" },
      ],
    },
  });
  assert.equal(simulators[0].type, "iPhone");
  assert.deepEqual(common.filterSimulatorsByState(simulators, "available").map((sim) => sim.name), ["iPad Air"]);
  assert.equal(common.resolveDeviceIdentifier("iPhone 16", simulators, null), "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE");
  assert.equal(common.resolveDeviceIdentifier("booted", simulators, "BOOTED-UDID"), "BOOTED-UDID");

  assert.deepEqual(create.parseDeviceTypes({ devicetypes: [{ name: "iPhone 16 Pro", identifier: "com.apple.iPhone" }] }), [
    { name: "iPhone 16 Pro", identifier: "com.apple.iPhone" },
  ]);
  assert.deepEqual(
    create.parseRuntimes({
      runtimes: [
        { name: "watchOS 11", identifier: "com.apple.CoreSimulator.SimRuntime.watchOS-11-0" },
        { name: "iOS 18.0", identifier: "com.apple.CoreSimulator.SimRuntime.iOS-18-0" },
      ],
    }),
    [{ name: "iOS 18.0", identifier: "com.apple.CoreSimulator.SimRuntime.iOS-18-0" }],
  );
  assert.equal(boot.parseArgs(["--name", "iPhone 16 Pro", "--wait-ready"]).waitReady, true);
  assert.deepEqual(deleteScript.parseArgs(["--old", "3", "--yes"]), {
    udid: null,
    name: null,
    yes: true,
    all: false,
    type: null,
    old: 3,
    json: false,
    help: false,
  });
});

test("iOS interaction Node helpers 保持命令构造和日志解析", async () => {
  const appLauncher = await import(resolve(scriptsDir, "app_launcher.mjs"));
  const interaction = await import(resolve(scriptsDir, "interaction_common.mjs"));
  const clipboard = await import(resolve(scriptsDir, "clipboard.mjs"));
  const gesture = await import(resolve(scriptsDir, "gesture.mjs"));
  const keyboard = await import(resolve(scriptsDir, "keyboard.mjs"));
  const logMonitor = await import(resolve(scriptsDir, "log_monitor.mjs"));
  const privacy = await import(resolve(scriptsDir, "privacy_manager.mjs"));
  const push = await import(resolve(scriptsDir, "push_notification.mjs"));
  const statusBar = await import(resolve(scriptsDir, "status_bar.mjs"));

  assert.deepEqual(interaction.buildIdbCommand("ui text", "UDID-1", "hello"), [
    "idb",
    "ui",
    "text",
    "hello",
    "--udid",
    "UDID-1",
  ]);
  assert.deepEqual(interaction.transformScreenshotCoords(10, 20, 100, 200, 390, 844), [39, 84]);
  assert.deepEqual(interaction.parseCoordinatePair("12,34"), [12, 34]);

  assert.deepEqual(clipboard.parseArgs(["--copy", "hello", "--test-name", "login"]), {
    copy: "hello",
    udid: null,
    testName: "login",
    expected: null,
    help: false,
  });
  assert.deepEqual(gesture.buildSwipeCoordinates(390, 844, "left", 0.7), [312, 422, 195, 422]);
  assert.equal(keyboard.resolveKeyCode("return"), 40);
  assert.equal(keyboard.resolveKeyCode("42"), 42);
  assert.equal(logMonitor.parseTimeDuration("5m"), 300);
  assert.equal(logMonitor.classifyLogLine("2026-01-01 failed to open database"), "error");
  assert.deepEqual(
    logMonitor.buildLogCommand({ appBundleId: "com.example.MyApp", deviceUdid: "booted" }).slice(0, 8),
    ["xcrun", "simctl", "spawn", "booted", "log", "stream", "--predicate", 'processImagePath CONTAINS "MyApp"'],
  );
  assert.equal(appLauncher.parseLaunchPid("com.example.app: 12345\n"), 12345);
  assert.deepEqual(appLauncher.parseListAppsJson({ "com.example.app": { CFBundleName: "Example", CFBundleVersion: "1" } }), [
    {
      bundle_id: "com.example.app",
      name: "Example",
      path: "",
      version: "1",
      type: "User",
    },
  ]);
  assert.match(
    privacy.formatAudit("grant", "com.example.app", "camera", {
      scenario: "login",
      step: 2,
      timestamp: "2026-01-01T00:00:00.000Z",
    }),
    /GRANT camera for com\.example\.app in login \(step 2\)/,
  );
  assert.deepEqual(push.normalizePayload({ alert: { title: "Hi" } }), { aps: { alert: { title: "Hi" } } });
  assert.deepEqual(statusBar.buildStatusBarOverrideCommand("UDID-1", statusBar.PRESETS.testing), [
    "xcrun",
    "simctl",
    "status_bar",
    "UDID-1",
    "override",
    "--time",
    "11:11",
    "--dataNetwork",
    "4g",
    "--wifiMode",
    "active",
    "--batteryState",
    "discharging",
    "--batteryLevel",
    "50",
  ]);
});
