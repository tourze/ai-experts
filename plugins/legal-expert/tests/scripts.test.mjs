import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import test from "node:test";

const pluginRoot = resolve("plugins/legal-expert");
const scriptFiles = [
  "hooks/dispatch.mjs",
  "hooks/session-start/plugin-sanity.mjs",
].map((file) => resolve(pluginRoot, file));

test("所有 hook 脚本都能通过 node --check", () => {
  for (const file of scriptFiles) {
    execFileSync("node", ["--check", file], { stdio: "pipe" });
  }
});

test("plugin.json 与 hooks.json 都是合法 JSON", () => {
  JSON.parse(readFileSync(resolve(pluginRoot, ".claude-plugin/plugin.json"), "utf-8"));
  JSON.parse(readFileSync(resolve(pluginRoot, "hooks/hooks.json"), "utf-8"));
  assert.ok(true);
});
