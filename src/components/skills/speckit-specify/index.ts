import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const speckitSpecifySkill = defineSkill({
  id: "speckit-specify",
  description: "当用户要把自然语言需求转成 spec.md、更新特性规格、用户故事或验收标准时使用。",
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
      summary: "Eval cases for speckit-specify.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
