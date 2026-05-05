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
  constraints: [
    "只在本 skill 的适用场景内使用；任务不匹配时先澄清或转向更合适的 skill。",
    "执行时遵循正文中的流程、红线、检查清单和必要参考资料，不用未经验证的假设替代证据。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
