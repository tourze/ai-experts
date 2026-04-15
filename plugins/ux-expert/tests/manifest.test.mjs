import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/ux-expert");
const manifestPath = resolve(pluginRoot, ".claude-plugin/plugin.json");
const hooksPath = resolve(pluginRoot, "hooks/hooks.json");

test("manifest 显式声明 skills、hooks、作者，且不再使用无效 dependencies 对象", () => {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const hooks = JSON.parse(readFileSync(hooksPath, "utf-8"));

  assert.equal(manifest.name, "ux-expert");
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.equal(manifest.author?.name, "ai-experts");
  assert.equal(manifest.skills, "./skills/");
  assert.equal("hooks" in manifest, false);
  assert.deepEqual(manifest.keywords, ["ux", "usability", "user-research", "visual-design", "heuristics"]);
  assert.equal("dependencies" in manifest, false);

  assert.ok(existsSync(resolve(pluginRoot, manifest.skills)));
  assert.ok(existsSync(hooksPath));
  assert.deepEqual(hooks.hooks ?? {}, {});
});
