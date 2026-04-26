import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
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
    "navigator.mjs",
    "app_launcher.mjs",
    "privacy_manager.mjs",
    "push_notification.mjs",
    "screen_mapper.mjs",
    "status_bar.mjs",
    "sim_list.mjs",
    "simulator_selector.mjs",
    "accessibility_audit.mjs",
    "screenshot_common.mjs",
    "app_state_capture.mjs",
    "test_recorder.mjs",
    "visual_diff.mjs",
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
    ["navigator.mjs", /Navigate iOS apps using accessibility data/],
    ["app_launcher.mjs", /Control iOS app lifecycle/],
    ["privacy_manager.mjs", /Manage iOS app privacy and permissions/],
    ["push_notification.mjs", /Send simulated push notification/],
    ["screen_mapper.mjs", /Map current screen UI elements/],
    ["status_bar.mjs", /Override iOS simulator status bar/],
    ["sim_list.mjs", /List iOS simulators with progressive disclosure/],
    ["simulator_selector.mjs", /Intelligent iOS simulator selector/],
    ["accessibility_audit.mjs", /Audit iOS simulator screen for accessibility issues/],
    ["app_state_capture.mjs", /Capture complete app state for debugging/],
    ["test_recorder.mjs", /Record test execution with screenshots and documentation/],
    ["visual_diff.mjs", /Compare screenshots for visual differences/],
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
  const accessibilityAudit = await import(resolve(scriptsDir, "accessibility_audit.mjs"));
  const appStateCapture = await import(resolve(scriptsDir, "app_state_capture.mjs"));
  const clipboard = await import(resolve(scriptsDir, "clipboard.mjs"));
  const gesture = await import(resolve(scriptsDir, "gesture.mjs"));
  const keyboard = await import(resolve(scriptsDir, "keyboard.mjs"));
  const logMonitor = await import(resolve(scriptsDir, "log_monitor.mjs"));
  const navigator = await import(resolve(scriptsDir, "navigator.mjs"));
  const privacy = await import(resolve(scriptsDir, "privacy_manager.mjs"));
  const push = await import(resolve(scriptsDir, "push_notification.mjs"));
  const screenMapper = await import(resolve(scriptsDir, "screen_mapper.mjs"));
  const screenshot = await import(resolve(scriptsDir, "screenshot_common.mjs"));
  const simList = await import(resolve(scriptsDir, "sim_list.mjs"));
  const simulatorSelector = await import(resolve(scriptsDir, "simulator_selector.mjs"));
  const statusBar = await import(resolve(scriptsDir, "status_bar.mjs"));
  const testRecorder = await import(resolve(scriptsDir, "test_recorder.mjs"));
  const visualDiff = await import(resolve(scriptsDir, "visual_diff.mjs"));
  const tree = {
    type: "Window",
    AXUniqueId: "LoginViewController",
    enabled: true,
    children: [
      { type: "NavigationBar", AXLabel: "Sign In", enabled: true, children: [] },
      {
        type: "Button",
        AXLabel: "Login",
        enabled: true,
        frame: { x: 10, y: 20, width: 100, height: 40 },
        children: [],
      },
      {
        type: "TextField",
        AXLabel: "Email",
        AXValue: "",
        enabled: true,
        frame: { x: 0, y: 80, width: 200, height: 40 },
        children: [],
      },
    ],
  };

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
  assert.deepEqual(interaction.flattenTree(tree).map((node) => node.type), ["Window", "NavigationBar", "Button", "TextField"]);

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
  const element = new navigator.Element(tree.children[1]);
  assert.deepEqual(element.center, [60, 40]);
  const nav = new navigator.Navigator("UDID");
  nav.treeCache = tree;
  assert.equal(nav.findElement({ text: "log" }).label, "Login");
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
  const analysis = new screenMapper.ScreenMapper("UDID").analyzeTree(tree);
  assert.deepEqual(analysis.buttons, ["Login"]);
  assert.equal(analysis.text_fields.length, 1);
  assert.match(screenMapper.formatSummary(analysis), /Screen: LoginViewController/);
  assert.deepEqual(screenMapper.getNavigationHints(analysis), [
    "Login screen detected - find TextFields for credentials",
    "1 empty text field(s) - may need input",
  ]);
  const simulatorData = {
    devices: {
      "com.apple.CoreSimulator.SimRuntime.iOS-18-0": [
        {
          name: "iPhone 16 Pro",
          udid: "AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE",
          state: "Booted",
          isAvailable: true,
        },
        {
          name: "iPad Air",
          udid: "11111111-2222-3333-4444-555555555555",
          state: "Shutdown",
          isAvailable: true,
        },
      ],
      "com.apple.CoreSimulator.SimRuntime.iOS-17-5": [
        {
          name: "iPhone 15",
          udid: "22222222-3333-4444-5555-666666666666",
          state: "Shutdown",
          isAvailable: true,
        },
      ],
    },
  };
  const cache = new simList.ProgressiveCache(join(mkdtempSync(join(tmpdir(), "sim-list-")), "cache"));
  const lister = new simList.SimulatorLister(cache);
  const devices = lister.parseDevices(simulatorData);
  const summary = lister.getConciseSummary(devices);
  assert.equal(summary.summary.total_devices, 3);
  assert.equal(summary.summary.booted_devices, 1);
  assert.deepEqual(lister.getFullList(summary.cache_id, { deviceType: "iPhone" }).map((device) => device.name), [
    "iPhone 16 Pro",
    "iPhone 15",
  ]);
  assert.match(simList.formatSummary(summary), /Simulator Summary \[simulator-/);

  const selector = new simulatorSelector.SimulatorSelector({ lastUsedSimulator: "iPhone 15" });
  selector.parseSimulators(simulatorData);
  const suggestions = selector.getSuggestions(2);
  assert.equal(suggestions[0].name, "iPhone 15");
  assert.ok(suggestions[0].reasons.includes("Recently used"));
  assert.equal(simulatorSelector.extractIosVersion("com.apple.CoreSimulator.SimRuntime.iOS-18-0"), "18.0");
  assert.match(simulatorSelector.formatSuggestions(suggestions), /Available Simulators/);

  const auditor = new accessibilityAudit.AccessibilityAuditor("UDID");
  const issues = auditor.auditElement({ type: "Button", AXLabel: "", AXValue: "" });
  assert.deepEqual(issues.map((issue) => issue.rule), ["missing_label", "empty_button"]);
  assert.equal(auditor.auditElement({ type: "StaticText", traits: [] })[0].rule, "missing_traits");
  auditor.getAccessibilityTree = () => ({
    type: "Window",
    AXUniqueId: "Root",
    traits: ["window"],
    children: [{ type: "Image", traits: ["image"], children: [] }],
  });
  const audit = auditor.audit(false);
  assert.equal(audit.summary.critical, 1);
  assert.equal(audit.top_issues[0].rule, "image_no_alt");

  assert.equal(
    screenshot.generateScreenshotName("MyApp", "Login", "Empty", "20251028-143052"),
    "MyApp_Login_Empty_20251028-143052.png",
  );
  assert.deepEqual(screenshot.getSizePreset("quarter"), [0.25, 0.25]);
  assert.match(
    screenshot.formatScreenshotResult({ mode: "inline", width: 100, height: 200, base64_data: "abcd" }),
    /Base64 length: 4 chars/,
  );
  assert.deepEqual(
    appStateCapture.parseDeviceInfo("    iPhone 16 Pro (A1B2C3D4-E5F6-7890-ABCD-EF1234567890) (Booted)\n"),
    { name: "iPhone 16 Pro", udid: "A1B2C3D4-E5F6-7890-ABCD-EF1234567890", state: "Booted" },
  );
  assert.deepEqual(appStateCapture.summarizeLogLines(["warning: slow", "ERROR failed"]), {
    captured: true,
    lines: 2,
    warnings: 1,
    errors: 1,
  });
  assert.match(appStateCapture.createSummaryMarkdown({ timestamp: "2026-01-01T00:00:00.000Z" }), /# App State Capture/);
  assert.equal(testRecorder.safeTestName("Login Flow"), "login-flow");
  assert.equal(
    testRecorder.parseArgs(["--test-name", "Login Flow", "--output", "out", "--inline"]).testName,
    "Login Flow",
  );
  const recorder = new testRecorder.TestRecorder({
    testName: "Login Flow",
    outputDir: mkdtempSync(join(tmpdir(), "recorder-")),
    udid: "UDID",
    now: () => new Date(2026, 0, 1, 0, 0, 0),
    output: () => {},
  });
  assert.match(recorder.outputDir, /login-flow-20260101-000000$/);
  assert.equal(typeof recorder.generate_report, "function");

  const pngDir = mkdtempSync(join(tmpdir(), "visual-diff-"));
  const baselinePath = join(pngDir, "baseline.png");
  const currentPath = join(pngDir, "current.png");
  visualDiff.writePng(baselinePath, {
    width: 2,
    height: 1,
    data: Buffer.from([0, 0, 0, 255, 255, 255, 255, 255]),
  });
  visualDiff.writePng(currentPath, {
    width: 2,
    height: 1,
    data: Buffer.from([255, 0, 0, 255, 255, 255, 255, 255]),
  });
  const differ = new visualDiff.VisualDiffer(0.01);
  const diff = differ.compare(baselinePath, currentPath);
  assert.equal(diff.different_pixels, 1);
  assert.equal(diff.verdict, "FAIL");
  visualDiff.writePng(join(pngDir, "side-by-side.png"), visualDiff.generateSideBySideData(
    visualDiff.readPng(baselinePath),
    visualDiff.readPng(currentPath),
  ));
  assert.ok(readFileSync(join(pngDir, "side-by-side.png")).subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])));
});
