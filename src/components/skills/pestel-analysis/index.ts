import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const pestelAnalysisSkill = defineSkill({
  id: "pestel-analysis",
  description: "当用户要用 PESTEL/PEST 做宏观环境分析、外部因素评估或战略环境扫描时使用。",
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
      summary: "Eval cases for pestel-analysis.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
