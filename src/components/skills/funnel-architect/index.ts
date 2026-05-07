import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
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
    "入口人群、承诺、CTA 和转化目标明确。",
    "价值阶梯、页面顺序与报价逻辑一致。",
    "已考虑邮件/销售跟进、表单摩擦和异议处理。",
    "每一步都能被指标追踪。",
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
  antiPatterns: [
    defineAntiPattern({
      fail: "只改文案",
      pass: "重做承接链路",
    }),
    defineAntiPattern({
      fail: "没主报价直接 upsell",
      pass: "一个主报价",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "把流量入口、价值承接、核心报价、升级路径和留存复购设计成可追踪的转化系统。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认入口人群、流量来源、核心承诺、单步转化目标和成交门槛。",
      "画出漏斗路径：流量入口 -> 诱饵/预约 -> 核心报价 -> 升级项 -> 留存/复购。",
      "为每一级价值阶梯写清楚用户为什么现在升级，避免只用更多功能解释更高价格。",
      "检查页面顺序、CTA、表单摩擦、异议处理、销售跟进和培育链路是否一致。",
      "需要补用户情境时联动 `customer-journey-map`；需要定价结构时联动 `pricing-strategy`。",
      "为每一步定义事件、转化率、掉点、归因来源和改版实验。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "入口人群、承诺、CTA 和单步转化目标。",
      "漏斗路径与价值阶梯图。",
      "报价逻辑、升级理由和异议处理清单。",
      "追踪指标、掉点假设和优化实验。",
    ],
  }),
  tools: [],
});
