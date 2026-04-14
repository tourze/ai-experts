import assert from "node:assert/strict";
import test from "node:test";

import { run as runDependencyCheck } from "../hooks/session-start/dependency-check.mjs";
import { run as runPluginSanity } from "../hooks/session-start/plugin-sanity.mjs";

test("plugin-sanity 在仓库结构完整时不产生报告", async () => {
  const result = await runPluginSanity({});
  assert.equal(result, null);
});

test("dependency-check 在兄弟插件存在时不报告 frontend-expert", async () => {
  const result = await runDependencyCheck({});
  assert.equal(result, null);
});
