import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { tmpdir } from "node:os";
import test from "node:test";

import {
  collectInstalledPlugins,
  extractEnabledPluginNames,
} from "../hooks/session-start/dependency-check.mjs";

function writeJson(filePath, value) {
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, JSON.stringify(value, null, 2));
}

function writePlugin(parentDir, dirName, pluginName) {
  const manifestPath = join(parentDir, dirName, ".claude-plugin", "plugin.json");
  mkdirSync(join(parentDir, dirName, ".claude-plugin"), { recursive: true });
  writeFileSync(manifestPath, JSON.stringify({ name: pluginName }, null, 2));
}

async function withTempDir(fn) {
  const dir = mkdtempSync(join(tmpdir(), "react-expert-"));
  try {
    return await fn(dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

test("extractEnabledPluginNames 兼容 object 与 array 两种 enabledPlugins 结构", () => {
  assert.deepEqual(
    [...extractEnabledPluginNames({ enabledPlugins: { "javascript-expert@local": true, "go-expert@local": false } })],
    ["javascript-expert"],
  );

  assert.deepEqual(
    [...extractEnabledPluginNames({ enabledPlugins: ["typescript-expert@local", "react-expert@local"] })].sort(),
    ["react-expert", "typescript-expert"],
  );
});

test("collectInstalledPlugins 会综合 settings、兄弟目录和 cache", async () => {
  await withTempDir(async (root) => {
    const homeDir = join(root, "home");
    const cwd = join(root, "project");
    const siblingRoot = join(root, "plugins");
    const cacheRoot = join(root, "cache");

    writeJson(join(homeDir, ".claude", "settings.json"), {
      enabledPlugins: { "javascript-expert@local": true },
    });
    writeJson(join(cwd, ".claude", "settings.local.json"), {
      enabledPlugins: ["typescript-expert@local"],
    });
    writePlugin(siblingRoot, "next", "nextjs-expert");
    writePlugin(cacheRoot, "cached", "cached-plugin");

    const installed = collectInstalledPlugins({ homeDir, cwd, siblingRoot, cacheRoot });

    assert.ok(installed.has("javascript-expert"));
    assert.ok(installed.has("typescript-expert"));
    assert.ok(installed.has("nextjs-expert"));
    assert.ok(installed.has("cached-plugin"));
  });
});
