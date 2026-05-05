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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeReviewAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: nestjsLayeringPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: openapiSpecGenerationSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: typescriptTypeSafetySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
