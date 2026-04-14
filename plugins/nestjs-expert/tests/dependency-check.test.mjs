import assert from "node:assert/strict";
import test from "node:test";

import { run } from "../hooks/session-start/dependency-check.mjs";

test("dependency-check 在依赖已满足时不产生报告", async () => {
  const result = await run({});
  assert.equal(result, null);
});
