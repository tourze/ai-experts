import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { typescriptTypeSafetySkill } from "../../skills/typescript-type-safety/index";
import { nestjsLayeringPatternsSkill } from "../../skills/nestjs-layering-patterns/index";
import { openapiSpecGenerationSkill } from "../../skills/openapi-spec-generation/index";

export const typescriptEngineerAgent = defineAgent({
  id: "typescript-engineer",
  description: "当需要端到端设计或实现 TypeScript 项目时使用——覆盖类型系统设计、泛型与条件类型、边界类型安全、NestJS 分层架构与 OpenAPI 规范生成。它可以读取源码、设计方案、编写实现，在用户指定目录下产出代码与设计文档。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeEngineerAgentFrameworkSkill.description,
    },
    {
      id: typescriptTypeSafetySkill.id,
      mode: SkillUseMode.Preload,
      reason: typescriptTypeSafetySkill.description,
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
    }
  ],
});
