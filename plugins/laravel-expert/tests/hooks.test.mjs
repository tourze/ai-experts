import assert from "node:assert/strict";
import test from "node:test";

import { run as runDependencyCheck } from "../hooks/session-start/dependency-check.mjs";

test("dependency-check 能识别仓库内已存在的 php-expert 依赖", async () => {
  const result = await runDependencyCheck({});
  assert.equal(result, null);
});
