import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/youtube-expert");

const nodeScripts = [
  "hooks/dispatch.mjs",
];

const pythonScripts = [
  "skills/youtube-analysis/scripts/analyze_video.py",
  "skills/youtube-analysis/scripts/fetch_transcript.py",
  "skills/youtube-analysis/scripts/utils.py",
  "skills/youtube-search/scripts/search_youtube.py",
];

test("所有 Node 脚本都能通过语法检查", () => {
  for (const relativePath of nodeScripts) {
    const result = spawnSync("node", ["--check", resolve(pluginRoot, relativePath)], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, `${relativePath} 语法检查失败: ${result.stderr}`);
  }
});

test("所有 Python 脚本都能通过 py_compile", () => {
  for (const relativePath of pythonScripts) {
    const result = spawnSync("python3", ["-m", "py_compile", resolve(pluginRoot, relativePath)], {
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, `${relativePath} 语法检查失败: ${result.stderr}`);
  }
});

test("plugin.json 与 hooks.json 都是合法 JSON", () => {
  JSON.parse(readFileSync(resolve(pluginRoot, ".claude-plugin/plugin.json"), "utf-8"));
  JSON.parse(readFileSync(resolve(pluginRoot, "hooks/hooks.json"), "utf-8"));
});
