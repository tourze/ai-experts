import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/database-expert");
const manifestPath = resolve(pluginRoot, ".claude-plugin/plugin.json");
const hooksPath = resolve(pluginRoot, "hooks/hooks.json");

test("manifest 显式声明 author、skills 与 hooks", () => {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const hooks = JSON.parse(readFileSync(hooksPath, "utf-8"));

  assert.equal(manifest.name, "database-expert");
  assert.equal(manifest.version, "0.2.0");
  assert.equal(manifest.author?.name, "ai-experts");
  assert.equal(manifest.skills, "./skills/");
  assert.equal("hooks" in manifest, false);
  assert.equal("dependencies" in manifest, false);

  assert.ok(existsSync(resolve(pluginRoot, manifest.skills)));
  assert.ok(existsSync(hooksPath));
  const preToolHooks = hooks.hooks?.PreToolUse?.[0]?.hooks ?? [];
  assert.equal(preToolHooks.length, 1);
  assert.equal(
    preToolHooks[0]?.command,
    "node ${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.mjs pre-tool-use/bash",
  );
});
