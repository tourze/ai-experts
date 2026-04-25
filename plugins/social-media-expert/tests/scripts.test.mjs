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

test("Node 脚本通过语法检查", () => {
  const scripts = [
    `${root}/skills/social-platform-safety/scripts/content_filter.mjs`,
    `${root}/skills/douyin-video-summary/scripts/download_audio.mjs`,
    `${root}/skills/douyin-video-summary/scripts/transcribe.mjs`,
    `${root}/skills/xhs-graphic-generator/scripts/generate.mjs`,
  ];

  for (const script of scripts) {
    const result = run(process.execPath, ["--check", script]);
    assert.equal(result.status, 0, `${script}\n${result.stderr}`);
  }
});

test("download_audio.mjs 缺少参数时输出 usage", () => {
  const result = run(process.execPath, [
    `${root}/skills/douyin-video-summary/scripts/download_audio.mjs`,
  ]);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Usage: download_audio\.mjs/);
});

test("transcribe.mjs 在依赖缺失时给出明确错误", () => {
  const result = spawnSync(process.execPath, [
    `${root}/skills/douyin-video-summary/scripts/transcribe.mjs`,
  ], {
    cwd: resolve("."),
    encoding: "utf-8",
    env: {
      ...process.env,
      PATH: "",
    },
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /缺少 ffmpeg/);
});

test("generate.mjs 缺少 API key 时失败且不发请求", () => {
  const result = spawnSync(process.execPath, [
    `${root}/skills/xhs-graphic-generator/scripts/generate.mjs`,
    "prompt",
  ], {
    cwd: resolve("."),
    encoding: "utf-8",
    env: {
      ...process.env,
      MULERUN_API_KEY: "",
    },
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /请设置 MULERUN_API_KEY/);
});
