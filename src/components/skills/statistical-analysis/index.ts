import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { dataAnalysisSkill } from "../data-analysis/index";
import { dataStorytellingSkill } from "../data-storytelling/index";
import { dataVisualizationSkill } from "../data-visualization/index";
import { llmEvaluationSkill } from "../llm-evaluation/index";

export const statisticalAnalysisSkill = defineSkill({
  id: "statistical-analysis",
  fullName: "statistical-analysis",
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
      reason: "如果结论要面向业务方表达，是否同步给 `data-storytelling`。",
    },
    {
      get id() {
        return dataAnalysisSkill.id;
      },
      reason: "相关 skill：`data-analysis`、`data-visualization`、`data-storytelling`、`llm-evaluation`。",
    },
    {
      get id() {
        return dataVisualizationSkill.id;
      },
      reason: "相关 skill：`data-analysis`、`data-visualization`、`data-storytelling`、`llm-evaluation`。",
    },
    {
      get id() {
        return llmEvaluationSkill.id;
      },
      reason: "相关 skill：`data-analysis`、`data-visualization`、`data-storytelling`、`llm-evaluation`。",
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
  invocation: InvocationPolicy.ModelOnly,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
