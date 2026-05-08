import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { businessModelSkill } from "../business-model/index";
import { marketSizingAnalysisSkill } from "../market-sizing-analysis/index";

export const pricingStrategySkill = defineSkill({
  id: "pricing-strategy",
  fullName: "定价策略",
  description: "当用户要制定定价、包装方案、免费策略、涨价节奏或价值度量时使用；帮助在价值捕获、转化效率与市场定位之间做平衡。",
  useCases: [
    "SaaS 套餐设计、涨价、免费试用、价值度量或打包层级重构。",
    "需要参考 [references/research-methods.md](references/research-methods.md) 与 [references/tier-structure.md](references/tier-structure.md)。",
    "讨论商业模式或市场空间时，可配合 `business-model` 和 `market-sizing-analysis`。",
  ],
  constraints: [
    "先理解客户获得的价值、替代方案和购买流程，再决定价格。",
    "包装结构、价值度量和升级路径要一致，避免定价与产品体验互相打架。",
    "涨价、免费和折扣策略都要说明目标，不要同时追求“高 ARPU”和“零摩擦”。",
  ],
  checklist: [
    "已明确目标客群、价值度量和竞争替代品。",
    "套餐分层和升级理由对用户可解释。",
    "已考虑免费、试用、折扣和涨价的副作用。",
    "定价结论可落到销售、计费和产品限制上。",
  ],
  relatedSkills: [
    {
      get id() {
        return marketSizingAnalysisSkill.id;
      },
      reason: "讨论商业模式或市场空间时，可配合 `business-model` 和 `market-sizing-analysis`。",
    },
    {
      get id() {
        return businessModelSkill.id;
      },
      reason: "讨论商业模式或市场空间时，可配合 `business-model` 和 `market-sizing-analysis`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "跟随竞品定价",
      pass: "价值 + 差异化",
    }),
    defineAntiPattern({
      fail: "免费版自杀",
      pass: "免费有边界",
    }),
    defineAntiPattern({
      fail: "套餐硬卡位",
      pass: "价值度量分层",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "确认目标客群、购买流程、替代方案、核心价值和成功指标。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "选择价值度量、套餐层级、限制项、免费/试用边界和升级触发点。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "比较客户价值、竞品锚点、支付意愿、销售复杂度和计费实现成本。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "评估涨价、折扣、免费策略和套餐变化的副作用；需要分层细节时读取 `tier-structure` reference。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "输出定价建议、实验路径、风控条件和产品/销售/计费落地要求。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    title: "输出模板",
    items: [
      "定价表列：套餐、目标客群、核心价值、限制项、价格。",
    ],
  }),
  references: [
    defineReference({
      id: "research-methods",
      source: new URL("./references/research-methods.md", import.meta.url),
      target: "references/research-methods.md",
      title: "research-methods.md",
      summary: "定价策略研究方法，包括客户价值感知调研、价格敏感度测试和竞品定价分析。",
      loadWhen: "需要为定价决策收集市场数据或进行客户调研时读取。",
    }),
    defineReference({
      id: "tier-structure",
      source: new URL("./references/tier-structure.md", import.meta.url),
      target: "references/tier-structure.md",
      title: "tier-structure.md",
      summary: "套餐分层结构设计指南，包括价值度量、升级路径和打包策略。",
      loadWhen: "需要设计或重构 SaaS 套餐分层结构时读取。",
    }),
  ],
});
