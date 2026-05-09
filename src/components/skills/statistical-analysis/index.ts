import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { dataAnalysisSkill } from "../data-analysis/index";
import { dataStorytellingSkill } from "../data-storytelling/index";
import { dataVisualizationSkill } from "../data-visualization/index";
import { llmEvaluationSkill } from "../llm-evaluation/index";

export const statisticalAnalysisSkill = defineSkill({
  id: "statistical-analysis",
  fullName: "统计分析",
  description: "当用户要做统计推断、A/B test、hypothesis testing、p-value、confidence interval、regression 或判断统计结论是否可靠时使用。",
  useCases: [
    "用户问“这个差异算不算显著”“这个波动算异常吗”“这两个指标真的相关吗”。",
    "需要给业务指标补充分布、异常、方差、样本量与统计边界解释。",
    "需要对实验、AB、回归观测、趋势变化做更严格的解释。",
  ],
  constraints: [
    "先确认数据生成过程和样本口径，再谈统计方法。",
    "任何显著性结论都要同时给出效应量或业务影响，不只给 p 值。",
    "趋势、相关、因果必须分开表述；统计上相关不代表业务上可行动。",
    "数据量太小、偏差太大或采样机制不清楚时，应明确降级结论强度。",
  ],
  checklist: [
    "样本量、时间窗口、过滤条件是否明确。",
    "是否先看了分布、异常值和缺失值。",
    "是否说明了检验方法、假设前提和结论边界。",
  ],
  relatedSkills: [
    {
      get id() {
        return dataStorytellingSkill.id;
      },
      reason: "统计结论需要转成业务叙事或汇报口径时联动。",
    },
    {
      get id() {
        return dataAnalysisSkill.id;
      },
      reason: "需要先做数据清洗、聚合、缺失值或异常值检查时联动。",
    },
    {
      get id() {
        return dataVisualizationSkill.id;
      },
      reason: "需要用分布图、置信区间或趋势图解释统计结果时联动。",
    },
    {
      get id() {
        return llmEvaluationSkill.id;
      },
      reason: "统计对象是 LLM 评测集、模型对比或回归实验时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "只看均值",
      pass: "分布 + 分位数",
    }),
    defineAntiPattern({
      fail: "显著 = 重要",
      pass: "同时报效应量",
    }),
    defineAntiPattern({
      fail: "相关 = 因果",
      pass: "区分观测与因果",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认数据生成过程、样本量、时间窗口、过滤条件、采样机制和缺失/异常值。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "先看分布、分位数和异常，再做比较、相关、回归或假设检验；不要只看均值。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "显著性结论同时报告效应量、置信区间或业务影响；相关、趋势和因果分开表述。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "样本太小、偏差太大或采样不清时降低结论强度，并说明需要补充的数据。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "样本口径、方法选择、前提假设、分布/异常检查和统计结果。",
      "p 值之外的效应量、置信区间、业务影响和结论边界。",
      "可行动结论、不能下结论的原因、需要补充的数据或实验设计建议。",
    ],
  }),
});
