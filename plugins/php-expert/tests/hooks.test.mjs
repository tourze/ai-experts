import assert from "node:assert/strict";
import test from "node:test";

import { run as runTestOutputTruncationGuard } from "../hooks/pre-tool-use/bash/test-output-truncation-guard.mjs";

function commandPayload(command) {
  return { tool_input: { command } };
}

test("test-output-truncation-guard 会报告 pest \\| tail -2", async () => {
  const result = await runTestOutputTruncationGuard(commandPayload("./vendor/bin/pest | tail -2"));
  assert.equal(result?.decision, "report");
  assert.match(result?.reason ?? "", /tail\/head -2/);
});

test("test-output-truncation-guard 允许 tail -1 摘要", async () => {
  const result = await runTestOutputTruncationGuard(commandPayload("./vendor/bin/phpunit | tail -1"));
  assert.equal(result, null);
});

