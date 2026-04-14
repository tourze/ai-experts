import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/research-expert");

test("plugin.json 与 hooks.json 都是合法 JSON", () => {
  JSON.parse(readFileSync(resolve(pluginRoot, ".claude-plugin/plugin.json"), "utf-8"));
  JSON.parse(readFileSync(resolve(pluginRoot, "hooks/hooks.json"), "utf-8"));
});

test("technology-search 可作为模块导入且能读取 sources.json", async () => {
  const mod = await import(resolve(pluginRoot, "skills/technology-search/scripts/search_news.js"));
  const loadSources = mod.loadSources ?? mod.default?.loadSources;
  const sources = loadSources();

  assert.ok(Array.isArray(sources));
  assert.ok(sources.length > 0);
});

test("研究插件声明的 Python requirements 文件存在", () => {
  assert.ok(existsSync(resolve(pluginRoot, "skills/site-analyze/requirements.txt")));
  assert.ok(existsSync(resolve(pluginRoot, "skills/web-content-fetcher/requirements.txt")));
});
