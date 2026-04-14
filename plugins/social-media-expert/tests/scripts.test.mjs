import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { resolve } from "node:path";

const root = resolve("plugins/social-media-expert");

function run(command, args) {
  return spawnSync(command, args, {
    cwd: resolve("."),
    encoding: "utf-8",
  });
}

test("Shell 脚本通过 bash -n", () => {
  const scripts = [
    `${root}/skills/douyin-video-summary/scripts/download_audio.sh`,
    `${root}/skills/douyin-video-summary/scripts/transcribe.sh`,
    `${root}/skills/xhs-graphic-generator/scripts/generate.sh`,
  ];

  for (const script of scripts) {
    const result = run("bash", ["-n", script]);
    assert.equal(result.status, 0, `${script}\n${result.stderr}`);
  }
});

test("Python 脚本通过 py_compile", () => {
  const result = run("python3", [
    "-m",
    "py_compile",
    `${root}/skills/social-platform-safety/scripts/content_filter.py`,
  ]);

  assert.equal(result.status, 0, result.stderr);
});
