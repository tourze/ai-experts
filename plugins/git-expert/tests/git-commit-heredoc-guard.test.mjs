import test from "node:test";
import assert from "node:assert/strict";

import { run } from "../hooks/pre-tool-use/bash/git-commit-heredoc-guard.mjs";

function payload(command) {
  return { tool_input: { command } };
}

test("拦截 git commit heredoc message", async () => {
  const result = await run(payload("git commit -m \"$(cat <<'EOF'\nfeat(core): add guard\nEOF\n)\""));
  assert.equal(result?.decision, "block");
  assert.match(result?.reason ?? "", /heredoc/);
  assert.match(result?.reason ?? "", /多个 `-m` 参数/);
});

test("放行直接传字符串的 git commit -m", async () => {
  const result = await run(payload("git commit -m \"feat(core): add guard\" -m \"补充说明\""));
  assert.equal(result, null);
});
