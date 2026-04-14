import assert from "node:assert/strict";
import test from "node:test";

import { run as runPluginSanity } from "../hooks/session-start/plugin-sanity.mjs";

test("plugin-sanity 在当前插件结构正确时不报告问题", async () => {
  const result = await runPluginSanity();
  assert.equal(result, null);
});
