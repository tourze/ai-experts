import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const llmEvaluationSkill = defineSkill({
  id: "llm-evaluation",
  fullName: "llm-evaluation",
  description: "当用户要评估 LLM 应用效果或比较 prompt、模型表现时使用。",
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
      summary: "Eval cases for llm-evaluation.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
