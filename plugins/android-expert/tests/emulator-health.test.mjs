import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

const script = resolve("plugins/android-expert/skills/android-emulator-skill/scripts/emu_health_check.mjs");

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
