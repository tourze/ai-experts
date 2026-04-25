import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const dispatchPath = resolve("plugins/creative-expert/hooks/dispatch.mjs");
const screenshotDir = resolve("plugins/creative-expert/skills/screenshot/scripts");

test("dispatch 在空 stdin 下不崩溃", () => {
  const result = spawnSync("node", [dispatchPath, "session-start"], {
    cwd: resolve("."),
    input: "",
    encoding: "utf-8",
  });

  assert.equal(result.status, 0);
});

test("screenshot Node helpers 通过语法检查", () => {
  for (const script of ["ensure_macos_permissions.mjs", "take_screenshot_windows.mjs"]) {
    const result = spawnSync("node", ["--check", resolve(screenshotDir, script)], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, result.stderr);
  }
});

test("screenshot Node helpers 输出帮助信息", () => {
  const mac = spawnSync("node", [resolve(screenshotDir, "ensure_macos_permissions.mjs"), "--help"], {
    encoding: "utf-8",
  });
  assert.equal(mac.status, 0, mac.stderr);
  assert.match(mac.stdout, /macOS screenshot permission check/);

  const windows = spawnSync("node", [resolve(screenshotDir, "take_screenshot_windows.mjs"), "--help"], {
    encoding: "utf-8",
  });
  assert.equal(windows.status, 0, windows.stderr);
  assert.match(windows.stdout, /Windows screenshot helper/);
});

test("take_screenshot.py Windows test mode 仍可生成截图", () => {
  const result = spawnSync("python3", [
    resolve(screenshotDir, "take_screenshot.py"),
    "--mode",
    "temp",
  ], {
    encoding: "utf-8",
    env: {
      ...process.env,
      CODEX_SCREENSHOT_TEST_MODE: "1",
      CODEX_SCREENSHOT_TEST_PLATFORM: "Windows",
    },
  });

  assert.equal(result.status, 0, result.stderr);
  const output = result.stdout.trim();
  assert.ok(output.endsWith(".png"), output);
  assert.ok(existsSync(output), output);
  rmSync(output, { force: true });
});
