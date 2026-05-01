import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

const script = resolve("plugins/android-expert/skills/android-emulator-skill/scripts/emu_health_check.mjs");
const scriptsDir = resolve("plugins/android-expert/skills/android-emulator-skill/scripts");

test("emu_health_check.mjs 通过语法检查", () => {
  const result = spawnSync(process.execPath, ["--check", script], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});

test("emu_health_check.mjs 输出帮助信息", () => {
  const result = spawnSync(process.execPath, [script, "--help"], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Android Device\/Emulator Testing - Environment Health Check/);
  assert.match(result.stdout, /Usage: node scripts\/emu_health_check\.mjs/);
});

test("emu_health_check.mjs 缺少工具时返回失败", () => {
  const home = mkdtempSync(join(tmpdir(), "android-health-home-"));
  try {
    const result = spawnSync(process.execPath, [script], {
      encoding: "utf8",
      env: { ...process.env, ANDROID_HOME: "", HOME: home, PATH: "" },
    });

    assert.equal(result.status, 1);
    assert.match(result.stdout, /ANDROID_HOME environment variable not set/);
    assert.match(result.stdout, /ADB command not found/);
    assert.match(result.stdout, /Action required/);
  } finally {
    rmSync(home, { recursive: true, force: true });
  }
});

test("Android emulator Node interaction scripts 通过语法检查", () => {
  for (const name of [
    "app_launcher.mjs",
    "build_and_test.mjs",
    "common.mjs",
    "diagnose_app.mjs",
    "emulator_manage.mjs",
    "gesture.mjs",
    "keyboard.mjs",
    "log_monitor.mjs",
    "navigator.mjs",
    "screen_mapper.mjs",
  ]) {
    const result = spawnSync(process.execPath, ["--check", resolve(scriptsDir, name)], { encoding: "utf8" });
    assert.equal(result.status, 0, `${name}: ${result.stderr}`);
  }
});

test("Android emulator Node interaction scripts 输出帮助信息", () => {
  for (const [name, pattern] of [
    ["app_launcher.mjs", /Control Android app lifecycle/],
    ["build_and_test.mjs", /Build and test Android project/],
    ["diagnose_app.mjs", /Capture an Android app diagnosis bundle/],
    ["emulator_manage.mjs", /Manage Android emulators/],
    ["gesture.mjs", /Perform gestures on Android/],
    ["keyboard.mjs", /Android keyboard input/],
    ["log_monitor.mjs", /Monitor Android logs/],
    ["navigator.mjs", /Navigate Android apps/],
    ["screen_mapper.mjs", /Map Android UI elements/],
  ]) {
    const result = spawnSync(process.execPath, [resolve(scriptsDir, name), "--help"], { encoding: "utf8" });
    assert.equal(result.status, 0, `${name}: ${result.stderr}`);
    assert.match(result.stdout, pattern);
  }
});

test("Android emulator Node helpers 保持 ADB 参数转换", async () => {
  const common = await import(resolve(scriptsDir, "common.mjs"));
  const appLauncher = await import(resolve(scriptsDir, "app_launcher.mjs"));
  const buildAndTest = await import(resolve(scriptsDir, "build_and_test.mjs"));
  const diagnoseApp = await import(resolve(scriptsDir, "diagnose_app.mjs"));
  const emulatorManage = await import(resolve(scriptsDir, "emulator_manage.mjs"));
  const gesture = await import(resolve(scriptsDir, "gesture.mjs"));
  const keyboard = await import(resolve(scriptsDir, "keyboard.mjs"));
  const logMonitor = await import(resolve(scriptsDir, "log_monitor.mjs"));
  const navigator = await import(resolve(scriptsDir, "navigator.mjs"));
  const screenMapper = await import(resolve(scriptsDir, "screen_mapper.mjs"));

  assert.deepEqual(
    common.parseAdbDevices("List of devices attached\nemulator-5554\tdevice\nfoo\toffline\n"),
    ["emulator-5554"],
  );
  assert.deepEqual(common.parseScreenSize("Physical size: 1080x2400\n"), [1080, 2400]);
  assert.deepEqual(
    gesture.buildSwipeCommand(1000, 2000, "up", 400),
    ["shell", "input", "swipe", "500", "1800", "500", "200", "400"],
  );
  assert.equal(keyboard.resolveKeycode("enter"), 66);
  assert.equal(keyboard.encodeAdbText("a b%"), "a%sb%%");
  assert.deepEqual(
    logMonitor.buildLogcatCommand({ priority: "E", tag: null }, "emulator-5554", "123"),
    [common.ADB_PATH, "-s", "emulator-5554", "logcat", "-v", "color", "*:E", "--pid=123"],
  );
  assert.deepEqual(appLauncher.parsePackages("package:com.example\npackage:com.android.settings\n"), [
    "com.example",
    "com.android.settings",
  ]);
  assert.equal(appLauncher.getAppStateFromPidResult({ status: 0, stdout: "123\n" }), "running");
  assert.deepEqual(buildAndTest.buildGradleCommand("/tmp/gradlew", "assembleDebug", true, false), [
    "/tmp/gradlew",
    "clean",
    "assembleDebug",
    "-q",
  ]);
  assert.deepEqual(diagnoseApp.parseArgs(["--package", "com.example", "--force-stop", "--grep", "AndroidRuntime"]), {
    packageName: "com.example",
    activity: null,
    out: null,
    grep: "AndroidRuntime",
    tail: 500,
    waitMs: 3000,
    forceStop: true,
    clearLogcat: true,
    launch: true,
    serial: null,
    help: false,
  });
  assert.deepEqual(diagnoseApp.buildLaunchCommand("com.example", ".MainActivity"), [
    "shell",
    "am",
    "start",
    "-n",
    "com.example/.MainActivity",
  ]);
  assert.deepEqual(diagnoseApp.buildLaunchCommand("com.example"), [
    "shell",
    "monkey",
    "-p",
    "com.example",
    "-c",
    "android.intent.category.LAUNCHER",
    "1",
  ]);
  assert.deepEqual(diagnoseApp.buildLogcatDumpCommand({ tail: 100, pid: "123" }), [
    "logcat",
    "-d",
    "-v",
    "time",
    "-t",
    "100",
    "--pid=123",
  ]);
  assert.deepEqual(diagnoseApp.buildAdbInvocation(["logcat", "-c"], "emulator-5554"), [
    common.ADB_PATH,
    "-s",
    "emulator-5554",
    "logcat",
    "-c",
  ]);
  assert.equal(diagnoseApp.filterLines("one\nAndroidRuntime crash\ntwo\n", "AndroidRuntime"), "AndroidRuntime crash");
  assert.equal(diagnoseApp.sanitizeFilePart("com.example/app"), "com.example_app");
  assert.deepEqual(emulatorManage.parseAvdList("Pixel_8\n\nTablet\n"), ["Pixel_8", "Tablet"]);
  assert.deepEqual(screenMapper.parseBounds("[1,2][11,22]"), {
    x: 1,
    y: 2,
    width: 10,
    height: 20,
    center_x: 6,
    center_y: 12,
  });
  const analysis = screenMapper.analyzeXml(`
    <hierarchy>
      <node class="android.widget.Button" text="Login" resource-id="login_button" content-desc="" clickable="true" enabled="true" bounds="[0,0][100,50]" />
      <node class="android.widget.EditText" text="" resource-id="email" content-desc="Email" clickable="true" enabled="true" bounds="[0,60][200,100]" />
    </hierarchy>
  `);
  assert.deepEqual(analysis.buttons, ["Login", "Email"]);
  assert.equal(analysis.text_fields.length, 1);
  assert.equal(navigator.findElementInAnalysis(analysis, { text: "log" })["resource-id"], "login_button");
});
