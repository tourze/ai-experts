import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/ios-expert");
const manifestPath = resolve(pluginRoot, ".claude-plugin/plugin.json");
const hooksPath = resolve(pluginRoot, "hooks/hooks.json");
const agentsDir = resolve(pluginRoot, "agents");

test("ios-expert manifest, hooks, agents, and core directories are valid", () => {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const hooks = JSON.parse(readFileSync(hooksPath, "utf-8"));

  assert.equal(manifest.name, "ios-expert");
  assert.equal(manifest.skills, "./skills/");
  assert.ok(existsSync(resolve(pluginRoot, manifest.skills)));
  assert.ok(existsSync(hooksPath));
  assert.ok(existsSync(agentsDir));
  assert.ok(readdirSync(agentsDir).some((name) => name.endsWith(".md")));

  assert.ok(hooks.hooks?.SessionStart?.length > 0);
  assert.ok(hooks.hooks?.PostToolUse?.length > 0);
});
