import assert from "node:assert/strict";
import test from "node:test";

import { run as runPluginSanity } from "../hooks/session-start/plugin-sanity.mjs";
import { run as runVisualStructurePrimer } from "../hooks/user-prompt-submit/visual-structure-primer.mjs";

test("plugin-sanity 在仓库结构完整时不产生报告", async () => {
  const result = await runPluginSanity({});
  assert.equal(result, null);
});

test("visual-structure-primer 在命中结构化表达信号时注入 context", async () => {
  const result = await runVisualStructurePrimer({
    prompt: "帮我分析这个系统迁移计划，给出模块边界、阶段推进和风险拆解。",
  });

  assert.equal(result?.decision, "context");
  assert.match(result?.reason ?? "", /结构化表达 触发/);
  assert.match(result?.reason ?? "", /现状全貌/);
  assert.match(result?.reason ?? "", /阶段 \/ 优先级 \/ 执行计划/);
});

test("visual-structure-primer 对普通短问答不注入 context", async () => {
  const result = await runVisualStructurePrimer({
    prompt: "帮我润色这一句文案",
  });

  assert.equal(result, null);
});
