import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const comparativeAnalysisSkill = defineSkill({
  id: "comparative-analysis",
  description: "当用户要对比两个或多个仓库、框架、方案、工具或系统，需要结构化差异矩阵、优劣判断和可落地建议时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "output-template",
      source: new URL("./references/output-template.md", import.meta.url),
      target: "references/output-template.md",
      title: "output-template.md",
      summary: "Reference material for comparative-analysis.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for comparative-analysis.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
