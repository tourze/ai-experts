import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const businessHealthDiagnosticSkill = defineSkill({
  id: "business-health-diagnostic",
  description: "当用户要诊断业务健康度、做季度复盘或用记分卡发现增长/留存/效率问题时使用。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for business-health-diagnostic.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
