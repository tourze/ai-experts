import assert from "node:assert/strict";
import test from "node:test";

import { run as runPluginSanity } from "../hooks/session-start/plugin-sanity.mjs";

test("plugin-sanity 在仓库结构完整时不产生报告", async () => {
  const result = await runPluginSanity({});
  assert.equal(result, null);
});

