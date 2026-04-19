import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/react-native-expert");
const manifestPath = resolve(pluginRoot, ".claude-plugin/plugin.json");
const hooksPath = resolve(pluginRoot, "hooks/hooks.json");

test("manifest 声明 React 依赖且不再注册重复 hooks", () => {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
  const hooks = JSON.parse(readFileSync(hooksPath, "utf-8"));

  assert.equal(manifest.name, "react-native-expert");
  assert.equal(manifest.skills, "./skills/");
  assert.ok(Array.isArray(manifest.dependencies));
  assert.ok(manifest.dependencies.includes("react-expert"));
  assert.equal("hooks" in manifest, false);

  assert.ok(existsSync(resolve(pluginRoot, manifest.skills)));
  assert.ok(existsSync(hooksPath));
  assert.deepEqual(hooks.hooks, {});
  assert.equal(existsSync(resolve(pluginRoot, "hooks/session-start/env-detector.mjs")), false);
});
