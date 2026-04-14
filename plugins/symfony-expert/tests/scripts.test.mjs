import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/symfony-expert");
const hookFiles = [
  "hooks/dispatch.mjs",
  "hooks/post-tool-use/edit-write/_utils.mjs",
  "hooks/post-tool-use/edit-write/syntax-doctrine-entity.mjs",
  "hooks/post-tool-use/edit-write/syntax-twig.mjs",
  "hooks/pre-tool-use/edit-write/protected-paths.mjs",
  "hooks/session-start/dependency-check.mjs",
].map((file) => resolve(pluginRoot, file));

test("所有 hook 脚本都能通过 node --check", () => {
  for (const file of hookFiles) {
    execFileSync("node", ["--check", file], { stdio: "pipe" });
  }
});

test("plugin.json 与 hooks.json 都是合法 JSON", () => {
  JSON.parse(readFileSync(resolve(pluginRoot, ".claude-plugin/plugin.json"), "utf-8"));
  JSON.parse(readFileSync(resolve(pluginRoot, "hooks/hooks.json"), "utf-8"));
  assert.ok(true);
});
