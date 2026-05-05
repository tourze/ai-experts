import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
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
    "[ ] 已明确目标客群、价值度量和竞争替代品。",
    "[ ] 套餐分层和升级理由对用户可解释。",
    "[ ] 已考虑免费、试用、折扣和涨价的副作用。",
    "[ ] 定价结论可落到销售、计费和产品限制上。",
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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "research-methods",
      source: new URL("./references/research-methods.md", import.meta.url),
      target: "references/research-methods.md",
      title: "research-methods.md",
      summary: "Reference material for pricing-strategy.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "tier-structure",
      source: new URL("./references/tier-structure.md", import.meta.url),
      target: "references/tier-structure.md",
      title: "tier-structure.md",
      summary: "Reference material for pricing-strategy.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
