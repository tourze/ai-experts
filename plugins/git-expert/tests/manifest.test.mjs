import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const hooksPath = resolve("plugins/git-expert/hooks/hooks.json");

test("hooks.json 只注册 PreToolUse Bash", () => {
  const hooks = JSON.parse(readFileSync(hooksPath, "utf-8"));

  assert.equal(hooks.hooks?.SessionStart, undefined);

  const preToolHooks = hooks.hooks?.PreToolUse?.[0]?.hooks ?? [];
  assert.equal(preToolHooks.length, 1);
  assert.equal(preToolHooks[0]?.command, "node ${CLAUDE_PLUGIN_ROOT}/hooks/dispatch.mjs pre-tool-use/bash");
});
