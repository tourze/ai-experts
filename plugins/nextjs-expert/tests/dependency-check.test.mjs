import assert from "node:assert/strict";
import test from "node:test";

import { run } from "../hooks/session-start/dependency-check.mjs";

test("dependency-check 在配套插件可见时不产生报告", async () => {
  const result = await run({});
  assert.equal(result, null);
});
