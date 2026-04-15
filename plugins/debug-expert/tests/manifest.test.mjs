import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/debug-expert");
const manifestPath = resolve(pluginRoot, ".claude-plugin/plugin.json");
const hooksPath = resolve(pluginRoot, "hooks/hooks.json");

test("manifest 显式声明 author、skills 与 hooks", () => {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const hooks = JSON.parse(readFileSync(hooksPath, "utf-8"));

  assert.equal(manifest.name, "debug-expert");
  assert.equal(manifest.author?.name, "ai-experts");
  assert.equal(manifest.skills, "./skills/");
  assert.equal("hooks" in manifest, false);
  assert.deepEqual(manifest.keywords, ["debug", "lldb", "gdb", "chrome-devtools", "browser-use"]);

  assert.ok(existsSync(resolve(pluginRoot, manifest.skills)));
  assert.ok(existsSync(hooksPath));
  assert.deepEqual(hooks.hooks ?? {}, {});
});
