import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { laravelPatternsSkill } from "../../skills/laravel-patterns/index";
import { laravelSecuritySkill } from "../../skills/laravel-security/index";
import { laravelVerificationSkill } from "../../skills/laravel-verification/index";
import { laravelTddSkill } from "../../skills/laravel-tdd/index";
import { phpDesignPatternsSkill } from "../../skills/php-design-patterns/index";
import { phpXFeaturesSkill } from "../../skills/php-8x-features/index";
import { phpTypeSafetySkill } from "../../skills/php-type-safety/index";
import { phpErrorHandlingSkill } from "../../skills/php-error-handling/index";
import { phpTestingSkill } from "../../skills/php-testing/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";
import { phpGeneratorsMemorySkill } from "../../skills/php-generators-memory/index";

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
      reason: codeEngineerAgentFrameworkSkill.description,
    },
    {
      id: laravelPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: laravelPatternsSkill.description,
    },
    {
      id: laravelSecuritySkill.id,
      mode: SkillUseMode.Preload,
      reason: laravelSecuritySkill.description,
    },
    {
      id: laravelVerificationSkill.id,
      mode: SkillUseMode.Preload,
      reason: laravelVerificationSkill.description,
    },
    {
      id: laravelTddSkill.id,
      mode: SkillUseMode.Preload,
      reason: laravelTddSkill.description,
    },
    {
      id: phpDesignPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: phpDesignPatternsSkill.description,
    },
    {
      id: phpXFeaturesSkill.id,
      mode: SkillUseMode.Preload,
      reason: phpXFeaturesSkill.description,
    },
    {
      id: phpTypeSafetySkill.id,
      mode: SkillUseMode.Preload,
      reason: phpTypeSafetySkill.description,
    },
    {
      id: phpErrorHandlingSkill.id,
      mode: SkillUseMode.Preload,
      reason: phpErrorHandlingSkill.description,
    },
    {
      id: phpTestingSkill.id,
      mode: SkillUseMode.Preload,
      reason: phpTestingSkill.description,
    },
    {
      id: testingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: testingPatternsSkill.description,
    },
    {
      id: phpGeneratorsMemorySkill.id,
      mode: SkillUseMode.Preload,
      reason: phpGeneratorsMemorySkill.description,
    }
  ],
});
