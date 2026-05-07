import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const startupViabilityChecklistSkill = defineSkill({
  id: "startup-viability-checklist",
  fullName: "创业项目可行性检查清单",
  description: "当需要快速评估创业项目整体可行性、识别创业风险或判断项目是否值得继续投入时使用。",
  useCases: [
    "新创业想法的首次系统化评估。",
    "季度复盘检查假设漂移。",
    "投资人沟通前的自检。",
    "Pivot 决策前的全盘重估。",
  ],
  constraints: [
    "不跳过用户验证：没有真实用户反馈的想法评估等于自我欺骗。",
    "不做线性外推：市场规模不用「假设 1% 市占率」这种无意义估算。",
    "不回避竞争：「我们没有竞争对手」要么是没做调研，要么是没市场。",
    "不混淆假设和事实：每项标注「已验证」还是「假设」。",
    "执行时遵循正文中的流程和检查清单，不用未经验证的假设替代证据。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "逐项标注状态和置信度：想法验证、ICP、市场规模、商业模式、业务健康度、定价、渠道、竞争、融资、团队、用户旅程、不确定性。",
      "想法验证必须问真实用户、替代方案、不解决后果和 Mom Test 访谈结论。",
      "市场规模要用至少两种方法交叉验证 TAM/SAM/SOM，不用假设 1% 市占率。",
      "商业模式检查收入模型、单位经济、CLV/CAC ≥3、毛利率和增长投入承载能力。",
      "渠道检查主要获客渠道、CAC、是否有 2+ 渠道和 ICP 匹配度。",
      "竞争检查前三竞品、差异化、壁垒和一句话“为什么选你”。",
      "最后收敛最大的 3 个不确定性、验证计划、pivot 方向和现金流跑道。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "创业项目评估：Strong/Moderate/Weak 总评、致命盲区、核心优势。",
      "维度评分表：12 维度、状态、置信度、关键发现和已验证/假设标记。",
      "致命假设、Top 3 优先行动、验证指标、停止条件和当前阶段不做的事。",
    ],
  }),
  tools: [],
});
