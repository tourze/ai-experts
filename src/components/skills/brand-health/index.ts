import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const brandHealthSkill = defineSkill({
  id: "brand-health",
  description: "当用户要诊断品牌健康度、评估品牌漏斗或判断品牌问题环节时使用。新品牌（<6 个月）或纯营销执行方案不适用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for brand-health.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
