import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const brandHealthSkill = defineSkill({
  id: "brand-health",
  fullName: "品牌健康度诊断",
  description: "当用户要诊断品牌健康度、评估品牌漏斗或判断品牌问题环节时使用。新品牌（<6 个月）或纯营销执行方案不适用。",
  useCases: [
    "定期品牌健康检查（季度/年度）。",
    "品牌重塑前的诊断。",
    "与 [content-strategy](../content-strategy/SKILL.md) 配合：品牌诊断找问题，内容策略做修复。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
