import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/frontend-expert");
const manifestPath = resolve(pluginRoot, ".claude-plugin/plugin.json");
const hooksPath = resolve(pluginRoot, "hooks/hooks.json");

test("manifest 与 hooks 配置指向真实文件，且声明前端所需依赖", () => {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const hooks = JSON.parse(readFileSync(hooksPath, "utf-8"));

  assert.equal(manifest.name, "frontend-expert");
  assert.equal(manifest.skills, "./skills/");
  assert.equal("hooks" in manifest, false);
  assert.deepEqual(manifest.dependencies, ["javascript-expert"]);

  assert.ok(existsSync(resolve(pluginRoot, manifest.skills)));
  assert.ok(existsSync(hooksPath));
  assert.ok(existsSync(resolve(pluginRoot, "..", "javascript-expert", ".claude-plugin", "plugin.json")));
  const sessionHooks = hooks.hooks?.SessionStart?.[0]?.hooks ?? [];
  assert.equal(sessionHooks[0]?.command, "node ${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.mjs session-start");
});
