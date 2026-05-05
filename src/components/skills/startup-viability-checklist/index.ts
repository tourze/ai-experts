import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const startupViabilityChecklistSkill = defineSkill({
  id: "startup-viability-checklist",
  description: "当需要快速评估创业项目整体可行性、识别创业风险或判断项目是否值得继续投入时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for startup-viability-checklist.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
