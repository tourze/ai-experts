import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/mysql-expert");
const manifestPath = resolve(pluginRoot, ".claude-plugin/plugin.json");

test("manifest 显式声明 author、skills 与 dependencies", () => {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

  assert.equal(manifest.name, "mysql-expert");
  assert.equal(manifest.author?.name, "ai-experts");
  assert.equal(manifest.skills, "./skills/");
  assert.ok(Array.isArray(manifest.dependencies));
  assert.ok(manifest.dependencies.includes("database-expert"));
  assert.ok(existsSync(resolve(pluginRoot, manifest.skills)));
});
