import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/thinking-expert");
const manifestPath = resolve(pluginRoot, ".claude-plugin/plugin.json");
const hooksPath = resolve(pluginRoot, "hooks/hooks.json");
const readmePath = resolve(pluginRoot, "README.md");
const expectedSkills = [
  "consciousness-council",
  "cross-pollination-engine",
  "first-principles-decomposer",
  "fishbone-diagram",
  "five-w-two-h",
  "grill-me",
  "inversion-strategist",
  "mckinsey-7-step",
  "pdca-cycle",
  "priority-judge",
  "scientific-brainstorming",
  "scp-analysis",
  "socratic-teaching",
  "thinking-partner",
  "what-if-oracle",
];

test("manifest 声明 skills 与 hooks 并指向真实路径", () => {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const hooks = JSON.parse(readFileSync(hooksPath, "utf-8"));

  assert.equal(manifest.name, "thinking-expert");
  assert.equal(manifest.author?.name, "ai-experts");
  assert.equal(manifest.skills, "./skills/");
  assert.equal("hooks" in manifest, false);

  assert.ok(existsSync(resolve(pluginRoot, manifest.skills)));
  assert.ok(existsSync(hooksPath));
  assert.deepEqual(hooks.hooks ?? {}, {});
});

test("README 中列出的 skill 与实际目录一致", () => {
  const readme = readFileSync(readmePath, "utf-8");
  const actualSkills = readdirSync(resolve(pluginRoot, "skills"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  assert.deepEqual(actualSkills, [...expectedSkills].sort());
  for (const skill of expectedSkills) {
    assert.match(readme, new RegExp(`\\\`${skill}\\\``), `README 未列出 ${skill}`);
  }
});
