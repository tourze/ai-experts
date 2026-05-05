import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const marketSizingAnalysisSkill = defineSkill({
  id: "market-sizing-analysis",
  description: "当用户要计算 TAM/SAM/SOM、验证市场空间、支撑商业计划或融资叙事时使用；支持 top-down、bottom-up 和 value theory 三种方法。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "data-sources",
      source: new URL("./references/data-sources.md", import.meta.url),
      target: "references/data-sources.md",
      title: "data-sources.md",
      summary: "Reference material for market-sizing-analysis.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for market-sizing-analysis.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
