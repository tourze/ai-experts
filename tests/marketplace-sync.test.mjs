import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const repoRoot = resolve(".");
const pluginsRoot = resolve(repoRoot, "plugins");
const marketplacePath = resolve(repoRoot, ".claude-plugin", "marketplace.json");
const readmePath = resolve(repoRoot, "README.md");
const claudePath = resolve(repoRoot, "CLAUDE.md");

function collectPluginManifests() {
  const manifests = new Map();

  for (const pluginName of readdirSync(pluginsRoot)) {
    const manifestPath = resolve(pluginsRoot, pluginName, ".claude-plugin", "plugin.json");
    try {
      const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
      manifests.set(pluginName, manifest);
    } catch {
      continue;
    }
  }

  return manifests;
}

function normalizeDependencyBlock(markdown) {
  const match = markdown.match(/## 已声明的插件依赖\n([\s\S]*?)\n## /);
  assert.ok(match, "CLAUDE.md 缺少已声明的插件依赖区块");

  return match[1]
    .trim()
    .split("\n")
    .filter((line) => line.startsWith("- "))
    .map((line) => line.slice(2).trim())
    .sort();
}

test("marketplace 中的插件集合与版本和 manifests 保持一致", () => {
  const manifests = collectPluginManifests();
  const marketplace = JSON.parse(readFileSync(marketplacePath, "utf-8"));
  const entries = marketplace.plugins ?? [];

  assert.equal(entries.length, manifests.size, "marketplace 插件数量与 manifests 不一致");

  const marketplaceNames = entries.map((entry) => entry.name).sort();
  const manifestNames = [...manifests.keys()].sort();
  assert.deepEqual(marketplaceNames, manifestNames, "marketplace 插件集合与 manifests 不一致");

  for (const entry of entries) {
    const manifest = manifests.get(entry.name);
    assert.ok(manifest, `缺少 manifest: ${entry.name}`);
    assert.equal(entry.source, `./plugins/${entry.name}`, `${entry.name} source 不正确`);
    assert.equal(entry.version, manifest.version, `${entry.name} version 与 manifest 不一致`);
    assert.equal(entry.description, manifest.description, `${entry.name} description 与 manifest 不一致`);
  }
});

test("README 与 CLAUDE 中的插件数量声明保持同步", () => {
  const pluginCount = collectPluginManifests().size;
  const readme = readFileSync(readmePath, "utf-8");
  const claude = readFileSync(claudePath, "utf-8");

  const readmeMatch = readme.match(/当前 marketplace 收录 (\d+) 个插件/);
  const claudeMatch = claude.match(/包含 (\d+) 个领域专家插件/);

  assert.ok(readmeMatch, "README 缺少 marketplace 插件数量声明");
  assert.ok(claudeMatch, "CLAUDE.md 缺少插件数量声明");
  assert.equal(Number(readmeMatch[1]), pluginCount, "README 插件数量与 manifests 不一致");
  assert.equal(Number(claudeMatch[1]), pluginCount, "CLAUDE.md 插件数量与 manifests 不一致");
});

test("CLAUDE.md 中记录的依赖列表与 manifests 保持一致", () => {
  const manifests = collectPluginManifests();
  const claude = readFileSync(claudePath, "utf-8");
  const expected = [...manifests.entries()]
    .filter(([, manifest]) => Array.isArray(manifest.dependencies) && manifest.dependencies.length > 0)
    .map(([name, manifest]) => `${name} → ${manifest.dependencies.join(", ")}`)
    .sort();

  assert.deepEqual(normalizeDependencyBlock(claude), expected);
});
