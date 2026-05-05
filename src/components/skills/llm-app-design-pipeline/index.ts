import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const llmAppDesignPipelineSkill = defineSkill({
  id: "llm-app-design-pipeline",
  description: "当需要设计或优化基于 LLM 的应用时使用；提供从应用形态确认、逐段优化到 eval 验证的完整设计 pipeline。",
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
      summary: "Eval cases for llm-app-design-pipeline.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
