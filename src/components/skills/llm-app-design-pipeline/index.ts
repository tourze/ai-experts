import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const llmAppDesignPipelineSkill = defineSkill({
  id: "llm-app-design-pipeline",
  fullName: "LLM 应用设计 Pipeline",
  description: "当需要设计或优化基于 LLM 的应用时使用；提供从应用形态确认、逐段优化到 eval 验证的完整设计 pipeline。",
  useCases: [
    "当需要设计或优化基于 LLM 的应用时使用；提供从应用形态确认、逐段优化到 eval 验证的完整设计 pipeline。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
