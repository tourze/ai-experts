import assert from "node:assert/strict";
import test from "node:test";

import { run as runVisualBriefConcretizerPrimer } from "../hooks/user-prompt-submit/visual-brief-concretizer-primer.mjs";

test("visual-brief-concretizer-primer 命中抽象视觉需求时注入 context", async () => {
  const result = await runVisualBriefConcretizerPrimer({
    prompt: "客户说官网首页不够大气，希望视觉更高级一点，帮我先拆成设计 brief。",
  });

  assert.equal(result?.decision, "context");
  assert.match(result?.reason ?? "", /抽象视觉需求 触发/);
  assert.match(result?.reason ?? "", /visual-brief-concretizer/);
  assert.match(result?.reason ?? "", /品牌意图/);
  assert.match(result?.reason ?? "", /反模式/);
});

test("visual-brief-concretizer-primer 对非视觉专业请求不注入 context", async () => {
  const result = await runVisualBriefConcretizerPrimer({
    prompt: "帮我把这段专业代码重构一下，保持类型安全。",
  });

  assert.equal(result, null);
});
