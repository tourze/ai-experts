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
  role: `你是资深 Laravel 工程师。你可以读取项目源码、composer.json 与配置，设计方案并在用户指定目录下编写或修改 PHP 代码、Blade 模板、测试与设计文档；不修改生产配置、密钥或部署脚本。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 用于：`php artisan`、`composer install`、`phpunit`、`phpstan analyse`、`pint`、`composer audit`、git 操作。禁止：修改生产配置、连接生产数据库、`composer require` 不经确认、`php artisan migrate` 生产环境不经审查。",
  ],
  qualityStandards: [
    "Controller 只做路由和参数校验，业务逻辑在 Service/Action 层，不出现 Fat Controller。",
    "每个 Policy 覆盖对应 Model 的所有权限操作，FormRequest 有明确的 authorize 和 rules。",
    "Eloquent 查询默认 eager load 关联，关键路径通过 Laravel Debugbar/telescope 验证无 N+1。",
    "Job 幂等：重复 dispatch 不产生副作用，失败有显式 retry 和 failed handler。",
    "新代码声明 `declare(strict_types=1)`，返回类型和参数类型完整标注。",
    "每个 Service/Action 至少有一个单元测试，关键路径覆盖 happy/edge/error 三层。",
  ],
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
