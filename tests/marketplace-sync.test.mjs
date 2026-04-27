import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const repoRoot = resolve(".");
const pluginsRoot = resolve(repoRoot, "plugins");
const readmePath = resolve(repoRoot, "README.md");
const claudePath = resolve(repoRoot, "CLAUDE.md");

function countPluginDirs() {
  return readdirSync(pluginsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
    .length;
}

test("README 与 CLAUDE.md 声称的插件数量与目录实际数量一致", () => {
  const actual = countPluginDirs();
  const readme = readFileSync(readmePath, "utf-8");
  const claude = readFileSync(claudePath, "utf-8");

  const readmeMatch = readme.match(/(\d+)\s*个插件/);
  const claudeMatch = claude.match(/包含\s*(\d+)\s*个领域专家插件/);

  assert.ok(readmeMatch, "README 缺少插件数量声明");
  assert.ok(claudeMatch, "CLAUDE.md 缺少插件数量声明");
  assert.equal(Number(readmeMatch[1]), actual, "README 插件数量与目录不一致");
  assert.equal(Number(claudeMatch[1]), actual, "CLAUDE.md 插件数量与目录不一致");
});
