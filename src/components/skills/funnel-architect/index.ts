import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const funnelArchitectSkill = defineSkill({
  id: "funnel-architect",
  fullName: "漏斗架构",
  description: "当用户要设计销售漏斗、价值阶梯、落地页序列或线索转化路径时使用；帮助梳理入口、承接、报价与升级路径。",
  useCases: [
    "设计线索获取到成交的转化路径，或重构已有落地页和报价流程。",
    "需要把流量入口、价值阶梯、转化页面和后续培育串起来。",
    "需要补充用户旅程时可配合 [customer-journey-map](../customer-journey-map/SKILL.md)，讨论套餐结构时可配合 [pricing-strategy](../pricing-strategy/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
