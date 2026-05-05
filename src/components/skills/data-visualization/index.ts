import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { dataAnalysisSkill } from "../data-analysis/index";
import { dataStorytellingSkill } from "../data-storytelling/index";
import { statisticalAnalysisSkill } from "../statistical-analysis/index";

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
  checklist: [
    "图表类型是否与问题匹配：趋势/对比/分布/相关。",
    "轴标签、单位、标题、图例是否完整。",
    "颜色是否真的传递信息，而不是纯装饰。",
    "类别数是否合理，未用 3D、未用双 Y 轴、未把饼图用于 > 5 片。",
    "数据量是否匹配渲染方案（> 1k 考虑 Canvas；> 10k 必须聚合）。",
    "是否附 a11y 兜底：标题 + 数据表或 CSV。",
  ],
  relatedSkills: [
    {
      get id() {
        return dataStorytellingSkill.id;
      },
      reason: "如果图表最终要用于汇报，是否把 headline 与故事顺序同步给 `data-storytelling`。",
    },
    {
      get id() {
        return dataAnalysisSkill.id;
      },
      reason: "相关 skill：`data-analysis`、`statistical-analysis`、`data-storytelling`。",
    },
    {
      get id() {
        return statisticalAnalysisSkill.id;
      },
      reason: "相关 skill：`data-analysis`、`statistical-analysis`、`data-storytelling`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "6 系列折线 + 双 Y 轴",
      pass: "一图一问题",
    }),
    defineAntiPattern({
      fail: "颜色是唯一编码",
      pass: "颜色 + 形状 + 标签",
    }),
    defineAntiPattern({
      fail: "折线连类别 x 轴",
      pass: "柱图",
    }),
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
