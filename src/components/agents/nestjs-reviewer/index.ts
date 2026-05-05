import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index";
import { nestjsLayeringPatternsSkill } from "../../skills/nestjs-layering-patterns/index";
import { openapiSpecGenerationSkill } from "../../skills/openapi-spec-generation/index";
import { typescriptTypeSafetySkill } from "../../skills/typescript-type-safety/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const nestjsReviewerAgent = defineAgent({
  id: "nestjs-reviewer",
  description: "当需要只读审查 NestJS 模块分层、DI、Controller/Provider、Pipe/Guard/Interceptor 和测试结构 时使用。",
  role: `你是资深 NestJS 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeReviewAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeReviewAgentFrameworkSkill.description,
    },
    {
      id: nestjsLayeringPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: nestjsLayeringPatternsSkill.description,
    },
    {
      id: openapiSpecGenerationSkill.id,
      mode: SkillUseMode.Preload,
      reason: openapiSpecGenerationSkill.description,
    },
    {
      id: typescriptTypeSafetySkill.id,
      mode: SkillUseMode.Preload,
      reason: typescriptTypeSafetySkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
