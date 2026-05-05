import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index.js";
import { laravelPatternsSkill } from "../../skills/laravel-patterns/index.js";
import { laravelSecuritySkill } from "../../skills/laravel-security/index.js";
import { laravelVerificationSkill } from "../../skills/laravel-verification/index.js";
import { laravelTddSkill } from "../../skills/laravel-tdd/index.js";
import { phpDesignPatternsSkill } from "../../skills/php-design-patterns/index.js";
import { phpXFeaturesSkill } from "../../skills/php-8x-features/index.js";
import { phpTypeSafetySkill } from "../../skills/php-type-safety/index.js";
import { phpErrorHandlingSkill } from "../../skills/php-error-handling/index.js";
import { phpTestingSkill } from "../../skills/php-testing/index.js";
import { testingPatternsSkill } from "../../skills/testing-patterns/index.js";
import { phpGeneratorsMemorySkill } from "../../skills/php-generators-memory/index.js";

export const laravelEngineerAgent = defineAgent({
  id: "laravel-engineer",
  description: "当需要端到端设计或实现 Laravel 项目时使用——覆盖分层架构、Eloquent ORM、FormRequest 校验、Policy/Gate 授权、Queue/Job 异步、Migration 管理与 TDD 测试策略。它可以读取源码、设计方案、编写实现，在用户指定目录下产出代码与设计文档。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: codeEngineerAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: laravelPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: laravelSecuritySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: laravelVerificationSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: laravelTddSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: phpDesignPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: phpXFeaturesSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: phpTypeSafetySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: phpErrorHandlingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: phpTestingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: phpGeneratorsMemorySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
