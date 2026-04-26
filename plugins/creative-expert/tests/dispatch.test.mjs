import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const dispatchPath = resolve("plugins/creative-expert/hooks/dispatch.mjs");
const screenshotDir = resolve("plugins/creative-expert/skills/screenshot/scripts");
const conceptImageDir = resolve("plugins/creative-expert/skills/concept-to-image/scripts");
const conceptVideoDir = resolve("plugins/creative-expert/skills/concept-to-video/scripts");

test("dispatch 在空 stdin 下不崩溃", () => {
  const result = spawnSync("node", [dispatchPath, "session-start"], {
    cwd: resolve("."),
    input: "",
    encoding: "utf-8",
  });

  assert.equal(result.status, 0);
});

test("screenshot Node helpers 通过语法检查", () => {
  for (const script of ["ensure_macos_permissions.mjs", "take_screenshot.mjs", "take_screenshot_windows.mjs"]) {
    const result = spawnSync("node", ["--check", resolve(screenshotDir, script)], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, result.stderr);
  }
});

test("concept media Node helpers 通过语法检查", () => {
  for (const script of [
    resolve(conceptImageDir, "render_to_image.mjs"),
    resolve(conceptVideoDir, "add_audio.mjs"),
    resolve(conceptVideoDir, "render_video.mjs"),
  ]) {
    const result = spawnSync("node", ["--check", script], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, result.stderr);
  }
});

test("concept media Node helpers 输出帮助信息", () => {
  for (const [script, pattern] of [
    [resolve(conceptImageDir, "render_to_image.mjs"), /Render HTML to PNG or SVG/],
    [resolve(conceptVideoDir, "add_audio.mjs"), /Overlay audio onto/],
    [resolve(conceptVideoDir, "render_video.mjs"), /Render Manim scene to video/],
  ]) {
    const result = spawnSync("node", [script, "--help"], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, result.stderr);
    assert.match(result.stdout, pattern);
  }
});

test("screenshot Node helpers 输出帮助信息", () => {
  const main = spawnSync("node", [resolve(screenshotDir, "take_screenshot.mjs"), "--help"], {
    encoding: "utf-8",
  });
  assert.equal(main.status, 0, main.stderr);
  assert.match(main.stdout, /Cross-platform screenshot helper/);

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

test("take_screenshot.mjs Windows test mode 仍可生成截图", () => {
  const result = spawnSync("node", [
    resolve(screenshotDir, "take_screenshot.mjs"),
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

test("take_screenshot.mjs test mode 为无扩展路径补 png 后缀", () => {
  const outputBase = resolve("plugins/creative-expert/.tmp-screenshot-output");
  const result = spawnSync("node", [
    resolve(screenshotDir, "take_screenshot.mjs"),
    "--path",
    outputBase,
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
  assert.equal(output, `${outputBase}.png`);
  assert.ok(existsSync(output), output);
  rmSync(output, { force: true });
});

test("add_audio.mjs 构建音频滤镜时按最终时长计算淡出", async () => {
  const mod = await import(resolve(conceptVideoDir, "add_audio.mjs"));
  const filter = mod.buildAudioFilterFromDurations(10, 20, 0.5, 1, 2, true);

  assert.equal(
    filter,
    "volume=0.5,atrim=0:10.000,afade=t=in:st=0:d=1.000,afade=t=out:st=8.000:d=2.000",
  );
});

test("render_video.mjs 能定位 Manim 嵌套输出文件并校验输出后缀", async () => {
  const mod = await import(resolve(conceptVideoDir, "render_video.mjs"));
  const tmp = mkdtempSync(join(tmpdir(), "creative-render-video-"));

  try {
    const qualityDir = join(tmp, "videos", "scene", "480p15");
    mkdirSync(qualityDir, { recursive: true });
    const rendered = join(qualityDir, "ConceptScene.mp4");
    writeFileSync(rendered, "video");

    assert.equal(mod.findRenderedFile(tmp, "ConceptScene", "480p15", "mp4"), rendered);
    assert.equal(mod.resolveOutputPath(join(tmp, "final"), "mp4"), join(tmp, "final.mp4"));
    assert.throws(() => mod.resolveOutputPath(join(tmp, "final.webm"), "mp4"), /does not match/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test("render_to_image.mjs 规范化 SVG 声明和命名空间", async () => {
  const mod = await import(resolve(conceptImageDir, "render_to_image.mjs"));
  const svg = mod.normalizeSvgContent('<svg viewBox="0 0 10 10"><rect /></svg>');

  assert.match(svg, /^<\?xml version="1.0" encoding="UTF-8"\?>/);
  assert.match(svg, /xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
});
