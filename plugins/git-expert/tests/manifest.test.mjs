import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const hooksPath = resolve("plugins/git-expert/hooks/hooks.json");

test("hooks.json 同时注册 SessionStart 与 PreToolUse Bash", () => {
  const hooks = JSON.parse(readFileSync(hooksPath, "utf-8"));

  const sessionHooks = hooks.hooks?.SessionStart?.[0]?.hooks ?? [];
  assert.equal(sessionHooks.length, 1);
  assert.equal(sessionHooks[0]?.command, "node ${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.mjs session-start");

  const preToolHooks = hooks.hooks?.PreToolUse?.[0]?.hooks ?? [];
  assert.equal(preToolHooks.length, 1);
  assert.equal(preToolHooks[0]?.command, "node ${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.mjs pre-tool-use/bash");
});
