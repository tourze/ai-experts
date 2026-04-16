import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/symfony-expert");
const manifestPath = resolve(pluginRoot, ".claude-plugin/plugin.json");
const hooksPath = resolve(pluginRoot, "hooks/hooks.json");

test("manifest 与 hooks 配置指向真实文件，且声明 Symfony 所需依赖", () => {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const hooks = JSON.parse(readFileSync(hooksPath, "utf-8"));

  assert.equal(manifest.name, "symfony-expert");
  assert.equal(manifest.skills, "./skills/");
  assert.equal("hooks" in manifest, false);
  assert.equal(manifest.license, "MIT");
  assert.deepEqual(manifest.dependencies, ["php-expert"]);

  assert.ok(existsSync(resolve(pluginRoot, manifest.skills)));
  assert.ok(existsSync(hooksPath));
  assert.ok(existsSync(resolve(pluginRoot, "..", "php-expert", ".claude-plugin", "plugin.json")));
  const postToolHooks = hooks.hooks?.PostToolUse?.[0]?.hooks ?? [];
  const preToolHooks = hooks.hooks?.PreToolUse?.[0]?.hooks ?? [];
  assert.equal(postToolHooks[0]?.command, "node ${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.mjs post-tool-use/edit-write");
  assert.equal(preToolHooks[0]?.command, "node ${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.mjs pre-tool-use/edit-write");
});
