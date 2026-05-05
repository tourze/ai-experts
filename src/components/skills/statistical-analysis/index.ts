import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const statisticalAnalysisSkill = defineSkill({
  id: "statistical-analysis",
  description: "当用户要做统计推断、A/B test、hypothesis testing、p-value、confidence interval、regression 或判断统计结论是否可靠时使用。",
  invocation: InvocationPolicy.ModelOnly,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for statistical-analysis.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
