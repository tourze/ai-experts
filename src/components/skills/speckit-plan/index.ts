import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const speckitPlanSkill = defineSkill({
  id: "speckit-plan",
  description: "当用户要从 spec.md 制定技术计划、数据模型、接口契约、research 或 quickstart 设计时使用。",
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
      summary: "Eval cases for speckit-plan.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
