import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const dataVisualizationSkill = defineSkill({
  id: "data-visualization",
  description: "当用户要选择图表类型、判断图表是否合适、生成 Python 可视化代码、调整图表表达方式或设计 Dashboard 图表时使用。",
  invocation: InvocationPolicy.ModelOnly,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "chart-decision-matrix",
      source: new URL("./references/chart-decision-matrix.md", import.meta.url),
      target: "references/chart-decision-matrix.md",
      title: "chart-decision-matrix.md",
      summary: "Reference material for data-visualization.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for data-visualization.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
