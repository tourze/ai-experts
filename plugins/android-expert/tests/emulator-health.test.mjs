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
  assert.match(result.stdout, /Android Emulator Testing - Environment Health Check/);
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
  for (const name of ["common.mjs", "gesture.mjs", "keyboard.mjs", "log_monitor.mjs"]) {
    const result = spawnSync(process.execPath, ["--check", resolve(scriptsDir, name)], { encoding: "utf8" });
    assert.equal(result.status, 0, `${name}: ${result.stderr}`);
  }
});

test("Android emulator Node interaction scripts 输出帮助信息", () => {
  for (const [name, pattern] of [
    ["gesture.mjs", /Perform gestures on Android/],
    ["keyboard.mjs", /Android keyboard input/],
    ["log_monitor.mjs", /Monitor Android logs/],
  ]) {
    const result = spawnSync(process.execPath, [resolve(scriptsDir, name), "--help"], { encoding: "utf8" });
    assert.equal(result.status, 0, `${name}: ${result.stderr}`);
    assert.match(result.stdout, pattern);
  }
});

test("Android emulator Node helpers 保持 ADB 参数转换", async () => {
  const common = await import(resolve(scriptsDir, "common.mjs"));
  const gesture = await import(resolve(scriptsDir, "gesture.mjs"));
  const keyboard = await import(resolve(scriptsDir, "keyboard.mjs"));
  const logMonitor = await import(resolve(scriptsDir, "log_monitor.mjs"));

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
});
