import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";
import { customerJourneyMapSkill } from "../customer-journey-map/index";
import { pricingStrategySkill } from "../pricing-strategy/index";

export const funnelArchitectSkill = defineSkill({
  id: "funnel-architect",
  fullName: "漏斗架构",
  description: "当用户要设计销售漏斗、价值阶梯、落地页序列或线索转化路径时使用；帮助梳理入口、承接、报价与升级路径。",
  useCases: [
    "设计线索获取到成交的转化路径，或重构已有落地页和报价流程。",
    "需要把流量入口、价值阶梯、转化页面和后续培育串起来。",
    "需要补充用户旅程时可配合 `customer-journey-map`，讨论套餐结构时可配合 `pricing-strategy`。",
  ],
  constraints: [
    "先明确目标用户、核心承诺和单步转化目标，再设计页面和自动化链路。",
    "每一级价值阶梯都要回答“为什么现在值得升级”，不能只靠更多功能堆价格。",
    "漏斗设计必须考虑流量来源和成交门槛，不要把所有受众塞进同一条路径。",
  ],
  checklist: [
    "[ ] 入口人群、承诺、CTA 和转化目标明确。",
    "[ ] 价值阶梯、页面顺序与报价逻辑一致。",
    "[ ] 已考虑邮件/销售跟进、表单摩擦和异议处理。",
    "[ ] 每一步都能被指标追踪。",
  ],
  relatedSkills: [
    {
      get id() {
        return pricingStrategySkill.id;
      },
      reason: "需要补充用户旅程时可配合 `customer-journey-map`，讨论套餐结构时可配合 `pricing-strategy`。",
    },
    {
      get id() {
        return customerJourneyMapSkill.id;
      },
      reason: "需要补充用户旅程时可配合 `customer-journey-map`，讨论套餐结构时可配合 `pricing-strategy`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
