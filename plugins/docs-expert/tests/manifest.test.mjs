import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/docs-expert");
const manifestPath = resolve(pluginRoot, ".claude-plugin/plugin.json");
const hooksPath = resolve(pluginRoot, "hooks/hooks.json");

test("manifest 显式声明 skills、hooks 与作者", () => {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const hooks = JSON.parse(readFileSync(hooksPath, "utf-8"));

  assert.equal(manifest.name, "docs-expert");
  assert.match(manifest.version, /^\d+\.\d+\.\d+$/);
  assert.equal(manifest.author?.name, "ai-experts");
  assert.equal(manifest.skills, "./skills/");
  assert.equal(manifest.hooks, "./hooks/hooks.json");
  assert.deepEqual(manifest.keywords, ["docs", "pdf", "docx", "pptx", "xlsx", "markdown", "mermaid"]);

  assert.ok(existsSync(resolve(pluginRoot, manifest.skills)));
  assert.ok(existsSync(resolve(pluginRoot, manifest.hooks)));

  const sessionHooks = hooks.hooks?.SessionStart?.[0]?.hooks ?? [];
  assert.equal(sessionHooks.length, 1);
  assert.equal(sessionHooks[0].command, "node ${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.mjs session-start");

  const userPromptHooks = hooks.hooks?.UserPromptSubmit?.[0]?.hooks ?? [];
  assert.equal(userPromptHooks.length, 1);
  assert.equal(userPromptHooks[0].command, "node ${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.mjs user-prompt-submit");
});
