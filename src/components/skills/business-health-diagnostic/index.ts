import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const businessHealthDiagnosticSkill = defineSkill({
  id: "business-health-diagnostic",
  fullName: "业务健康度诊断",
  description: "当用户要诊断业务健康度、做季度复盘或用记分卡发现增长/留存/效率问题时使用。",
  useCases: [
    "季度复盘、董事会汇报前快速评估业务整体健康度。",
    "感觉\"哪里不对\"但说不清楚，需要系统化扫描定位问题。",
    "与 [process-optimization](../process-optimization/SKILL.md) 配合优化发现的瓶颈。",
    "需要更深入的专项分析时：\n- [references/balanced-scorecard.md](references/balanced-scorecard.md) — BSC 战略翻译工具\n- [references/blm-model.md](references/blm-model.md) — 业务领先模型（差距分析 + 战略执行）\n- [references/mckinsey-7s.md](references/mckinsey-7s.md) — 麦肯锡 7S 组织匹配模型",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "balanced-scorecard",
      source: new URL("./references/balanced-scorecard.md", import.meta.url),
      target: "references/balanced-scorecard.md",
      title: "balanced-scorecard.md",
      summary: "Reference material for business-health-diagnostic.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "blm-model",
      source: new URL("./references/blm-model.md", import.meta.url),
      target: "references/blm-model.md",
      title: "blm-model.md",
      summary: "Reference material for business-health-diagnostic.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "mckinsey-7s",
      source: new URL("./references/mckinsey-7s.md", import.meta.url),
      target: "references/mckinsey-7s.md",
      title: "mckinsey-7s.md",
      summary: "Reference material for business-health-diagnostic.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
