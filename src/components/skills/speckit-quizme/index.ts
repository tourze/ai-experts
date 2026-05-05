import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const speckitQuizmeSkill = defineSkill({
  id: "speckit-quizme",
  fullName: "Speckit Quizme",
  description: "当用户要用苏格拉底式追问挑战规格、挖掘隐含假设、边界场景或薄弱需求时使用。",
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
      summary: "Eval cases for speckit-quizme.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
