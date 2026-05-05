import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const planningUnderUncertaintySkill = defineSkill({
  id: "planning-under-uncertainty",
  description: "当用户要在高度不确定条件下做产品或战略规划时使用；帮助识别未知类型、保留选项、设置决策点与滚动调整机制。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for planning-under-uncertainty.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
