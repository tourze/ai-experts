import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/research-expert");

test("plugin.json 与 hooks.json 都是合法 JSON", () => {
  JSON.parse(readFileSync(resolve(pluginRoot, ".claude-plugin/plugin.json"), "utf-8"));
  JSON.parse(readFileSync(resolve(pluginRoot, "hooks/hooks.json"), "utf-8"));
});

test("technology-search 可作为模块导入且能读取 sources.json", async () => {
  const mod = await import(resolve(pluginRoot, "skills/technology-search/scripts/search_news.mjs"));
  const loadSources = mod.loadSources ?? mod.default?.loadSources;
  const sources = loadSources();

  assert.ok(Array.isArray(sources));
  assert.ok(sources.length > 0);
});

test("technology-search Node wrapper 通过语法检查", () => {
  const result = spawnSync("node", [
    "--check",
    resolve(pluginRoot, "skills/technology-search/scripts/search-news.mjs"),
  ], {
    encoding: "utf-8",
  });

  assert.equal(result.status, 0, result.stderr);
});

test("technology-search Node wrapper 保留缺少关键词的错误路径", () => {
  const result = spawnSync("node", [
    resolve(pluginRoot, "skills/technology-search/scripts/search-news.mjs"),
  ], {
    encoding: "utf-8",
  });

  assert.equal(result.status, 1);
  assert.match(result.stderr, /Missing required argument <keyword>/);
  assert.match(result.stderr, /search_news\.mjs <keyword>/);
});

test("研究插件声明的 Python requirements 文件存在", () => {
  assert.ok(existsSync(resolve(pluginRoot, "skills/site-analyze/requirements.txt")));
  assert.ok(existsSync(resolve(pluginRoot, "skills/web-content-fetcher/requirements.txt")));
});
