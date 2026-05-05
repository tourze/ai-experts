import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const statisticalAnalysisSkill = defineSkill({
  id: "statistical-analysis",
  fullName: "statistical-analysis",
  description: "当用户要做统计推断、A/B test、hypothesis testing、p-value、confidence interval、regression 或判断统计结论是否可靠时使用。",
  useCases: [
    "用户问“这个差异算不算显著”“这个波动算异常吗”“这两个指标真的相关吗”。",
    "需要给业务指标补充分布、异常、方差、样本量与统计边界解释。",
    "需要对实验、AB、回归观测、趋势变化做更严格的解释。",
    "相关 skill：[data-analysis](../data-analysis/SKILL.md)、[data-visualization](../data-visualization/SKILL.md)、[data-storytelling](../data-storytelling/SKILL.md)、[llm-evaluation](../llm-evaluation/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ModelOnly,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
