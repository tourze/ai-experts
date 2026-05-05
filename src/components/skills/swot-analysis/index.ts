import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const swotAnalysisSkill = defineSkill({
  id: "swot-analysis",
  fullName: "SWOT 分析",
  description: "当用户要做 SWOT 分析、梳理优势劣势、外部机会威胁与战略动作时使用；适合产品、业务或竞争位置评估。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "blue-ocean-strategy",
      source: new URL("./references/blue-ocean-strategy.md", import.meta.url),
      target: "references/blue-ocean-strategy.md",
      title: "blue-ocean-strategy.md",
      summary: "Reference material for swot-analysis.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "space-matrix",
      source: new URL("./references/space-matrix.md", import.meta.url),
      target: "references/space-matrix.md",
      title: "space-matrix.md",
      summary: "Reference material for swot-analysis.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for swot-analysis.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
