import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const pricingStrategySkill = defineSkill({
  id: "pricing-strategy",
  fullName: "定价策略",
  description: "当用户要制定定价、包装方案、免费策略、涨价节奏或价值度量时使用；帮助在价值捕获、转化效率与市场定位之间做平衡。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for pricing-strategy.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
