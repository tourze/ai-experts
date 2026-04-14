import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/ruby-expert");
const manifestPath = resolve(pluginRoot, ".claude-plugin/plugin.json");
const hooksPath = resolve(pluginRoot, "hooks/hooks.json");

test("manifest 显式声明 author、skills 与 hooks", () => {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const hooks = JSON.parse(readFileSync(hooksPath, "utf-8"));

  assert.equal(manifest.name, "ruby-expert");
  assert.equal(manifest.author?.name, "ai-experts");
  assert.equal(manifest.skills, "./skills/");
  assert.equal(manifest.hooks, "./hooks/hooks.json");

  assert.ok(existsSync(resolve(pluginRoot, manifest.skills)));
  assert.ok(existsSync(resolve(pluginRoot, manifest.hooks)));

  const postToolHooks = hooks.hooks?.PostToolUse?.[0]?.hooks ?? [];
  assert.equal(postToolHooks.length, 1);
  assert.equal(
    postToolHooks[0]?.command,
    "node ${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.mjs post-tool-use/edit-write",
  );
});
