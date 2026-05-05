import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const dataVisualizationSkill = defineSkill({
  id: "data-visualization",
  fullName: "data-visualization",
  description: "当用户要选择图表类型、判断图表是否合适、生成 Python 可视化代码、调整图表表达方式或设计 Dashboard 图表时使用。",
  useCases: [
    "需要把表格结果转成 line/bar/scatter/heatmap 等图表。",
    "用户并不缺数据，缺的是“该画什么图”和“怎么画得清楚”。",
    "需要给图表加注释、颜色策略、数值标签、可访问性约束。",
    "需要审查现有 Dashboard，判断哪些图选错了类型。",
    "需要把\"数据形状 → 图表类型\"规则内化成选型矩阵。",
    "相关 skill：[data-analysis](../data-analysis/SKILL.md)、[statistical-analysis](../statistical-analysis/SKILL.md)、[data-storytelling](../data-storytelling/SKILL.md)。",
  ],
  constraints: [
    "先回答“图要表达什么关系”，再选图；不要先有图型偏好。",
    "同一张图只承载一个主问题：趋势、对比、分布、相关，不要混搭。",
    "默认优先 2D、少颜色、少装饰、可读标签；除非有强理由，不用 3D、双轴、彩虹色。",
    "统计不确定性没有被解释清楚前，不要用图表强化虚假的确定性。",
    "类别数 > 15 时禁用柱图/饼图，改 Top-N 或表格。",
    "饼图禁用于 > 5 片或切片差异 < 5%，默认优先横向柱图。",
    "颜色不能是唯一编码维度，必须配合形状、标签或图案。",
  ],
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
  ],
});
