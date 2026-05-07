import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
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
      reason: "图表最终要用于汇报、叙事或 executive summary 时联动 headline 与故事顺序。",
    },
    {
      get id() {
        return dataAnalysisSkill.id;
      },
      reason: "需要先做数据清洗、聚合、探索性分析或指标计算时联动。",
    },
    {
      get id() {
        return statisticalAnalysisSkill.id;
      },
      reason: "图表涉及显著性、置信区间、分布假设或不确定性表达时联动。",
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先判断主问题：趋势、对比、构成、分布、相关或流转；每张图只回答一个主问题。",
      "按数据形状选首选图：时间序列用 line/area，对比用 bar/column，分布用 histogram/box，相关用 scatter，流转用 funnel/sankey。",
      "再过禁用清单：类别数过多、饼图切片过多、双轴、3D、彩虹色、类别轴折线都要降级或改图。",
      "需要代码时优先生成最小 matplotlib/Altair/Plotly 示例，包含标题、轴标签、单位、图例和布局收口。",
      "加入注释、数值标签或参考线时只服务结论，不做装饰。",
      "输出时补 a11y 兜底：文本摘要、数据表或 CSV；需要复杂选型时读取 chart-decision-matrix。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "图表选型：主问题、数据形状、候选图、禁用项检查和最终选择理由。",
      "呈现规格：标题、轴、单位、颜色、标签、注释、交互和可访问性兜底。",
      "需要生成代码时给出可运行图表代码、输入数据假设和渲染规模注意事项。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "chart-decision-matrix",
      source: new URL("./references/chart-decision-matrix.md", import.meta.url),
      target: "references/chart-decision-matrix.md",
      title: "chart-decision-matrix.md",
      summary: "数据形状到图表类型的选型矩阵，包括适用条件与禁忌条件。",
      loadWhen: "需要选择图表类型或审查现有图表是否匹配数据关系时读取。",
    }),
  ],
});
