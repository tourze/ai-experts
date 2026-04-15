import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/typescript-expert");
const manifestPath = resolve(pluginRoot, ".claude-plugin/plugin.json");
const hooksPath = resolve(pluginRoot, "hooks/hooks.json");

test("manifest 显式声明作者、skills、hooks，且不再使用无效 dependencies 对象", () => {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const hooks = JSON.parse(readFileSync(hooksPath, "utf-8"));

  assert.equal(manifest.name, "typescript-expert");
  assert.deepEqual(manifest.author, { name: "ai-experts" });
  assert.equal(manifest.skills, "./skills/");
  assert.equal("hooks" in manifest, false);
  assert.equal("dependencies" in manifest, false);

  assert.ok(existsSync(resolve(pluginRoot, manifest.skills)));
  assert.ok(existsSync(hooksPath));

  const postToolUse = hooks.hooks?.PostToolUse?.[0];
  assert.equal(postToolUse?.matcher, "Edit|Write");
  assert.equal(postToolUse?.hooks?.length, 1);
  assert.equal(
    postToolUse.hooks[0].command,
    "node ${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.mjs post-tool-use/edit-write",
  );
});
