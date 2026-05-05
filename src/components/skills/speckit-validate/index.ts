import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const speckitValidateSkill = defineSkill({
  id: "speckit-validate",
  description: "当用户要验证实现是否满足规格、计划、任务、验收标准或边界条件时使用。",
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
      summary: "Eval cases for speckit-validate.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
