import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/laravel-expert");
const manifestPath = resolve(pluginRoot, ".claude-plugin/plugin.json");
const hooksPath = resolve(pluginRoot, "hooks/hooks.json");

test("manifest 显式声明作者、skills、hooks 与依赖", () => {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const hooks = JSON.parse(readFileSync(hooksPath, "utf-8"));

  assert.equal(manifest.name, "laravel-expert");
  assert.equal(manifest.author?.name, "ai-experts");
  assert.equal(manifest.license, "MIT");
  assert.equal(manifest.skills, "./skills/");
  assert.equal("hooks" in manifest, false);
  assert.deepEqual(manifest.dependencies, ["php-expert"]);

  assert.ok(existsSync(resolve(pluginRoot, manifest.skills)));
  assert.ok(existsSync(hooksPath));
  assert.ok(existsSync(resolve(pluginRoot, "..", "php-expert", ".claude-plugin", "plugin.json")));
  const sessionHooks = hooks.hooks?.SessionStart?.[0]?.hooks ?? [];
  assert.equal(sessionHooks[0]?.command, "node ${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.mjs session-start");
});
