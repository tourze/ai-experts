import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const planningUnderUncertaintySkill = defineSkill({
  id: "planning-under-uncertainty",
  fullName: "不确定性下的规划",
  description: "当用户要在高度不确定条件下做产品或战略规划时使用；帮助识别未知类型、保留选项、设置决策点与滚动调整机制。",
  useCases: [
    "AI/新市场/复杂依赖项目的路线图规划、资源分配与阶段承诺。",
    "需要补充经验参考时可阅读 [references/guest-insights.md](references/guest-insights.md)。",
    "需要把不确定性转成估算或版本节奏时，可配合 [estimate-calibrator](../estimate-calibrator/SKILL.md)。",
    "需要把关键未知项转成先验、证据更新、行动阈值和敏感性报告时，配合 `what-if-oracle`。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "guest-insights",
      source: new URL("./references/guest-insights.md", import.meta.url),
      target: "references/guest-insights.md",
      title: "guest-insights.md",
      summary: "Reference material for planning-under-uncertainty.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
