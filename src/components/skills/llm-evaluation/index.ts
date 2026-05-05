import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const llmEvaluationSkill = defineSkill({
  id: "llm-evaluation",
  fullName: "llm-evaluation",
  description: "当用户要评估 LLM 应用效果或比较 prompt、模型表现时使用。",
  useCases: [
    "需要回答“这个 LLM 应用到底有没有变好”，而不是只看单次样例。",
    "需要比较不同模型、不同 prompt、不同 agent 流程的质量差异。",
    "需要建立离线样本集、评分 rubric、回归报警与上线门槛。",
    "相关 skill：[prompt-engineering-patterns](../prompt-engineering-patterns/SKILL.md)、[rag-auditor](../rag-auditor/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
