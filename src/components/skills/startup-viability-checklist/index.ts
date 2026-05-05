import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
