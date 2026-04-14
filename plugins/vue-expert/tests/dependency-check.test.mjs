import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/vue-expert");
const dependencyCheckSource = resolve(pluginRoot, "hooks/session-start/dependency-check.mjs");

function withTempPlugin(manifest, fn) {
  const root = mkdtempSync(join(tmpdir(), "vue-deps-"));
  const pluginDir = join(root, "vue-expert");
  const hookDir = join(pluginDir, "hooks", "session-start");
  mkdirSync(hookDir, { recursive: true });
  mkdirSync(join(pluginDir, ".claude-plugin"), { recursive: true });

  writeFileSync(join(pluginDir, ".claude-plugin", "plugin.json"), JSON.stringify(manifest, null, 2));
  writeFileSync(join(hookDir, "dependency-check.mjs"), readFileSync(dependencyCheckSource, "utf-8"));

  try {
    return fn(pluginDir);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("dependency-check 支持数组形式 dependencies 并报告缺失依赖", () => {
  withTempPlugin({
    name: "vue-expert",
    dependencies: ["javascript-expert"],
  }, (tempPluginRoot) => {
    const code = `
      import { pathToFileURL } from "node:url";
      const { run } = await import(pathToFileURL(${JSON.stringify(join(tempPluginRoot, "hooks", "session-start", "dependency-check.mjs"))}).href);
      const result = await run({});
      console.log(JSON.stringify(result));
    `;

    const result = spawnSync("node", ["--input-type=module", "--eval", code], {
      cwd: tempPluginRoot,
      encoding: "utf-8",
    });

    assert.equal(result.status, 0, result.stderr);
    const output = JSON.parse(result.stdout);
    assert.equal(output.decision, "report");
    assert.match(output.reason, /javascript-expert/);
  });
});
