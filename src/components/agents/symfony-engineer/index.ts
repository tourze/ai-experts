import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index";
import { symfonyBundleArchitectureSkill } from "../../skills/symfony-bundle-architecture/index";
import { symfonyMessengerSkill } from "../../skills/symfony-messenger/index";
import { symfonyUxSkill } from "../../skills/symfony-ux/index";
import { symfonyVotersSkill } from "../../skills/symfony-voters/index";
import { twigComponentsSkill } from "../../skills/twig-components/index";
import { doctrineEntityPatternsSkill } from "../../skills/doctrine-entity-patterns/index";
import { doctrineBatchProcessingSkill } from "../../skills/doctrine-batch-processing/index";
import { phpDesignPatternsSkill } from "../../skills/php-design-patterns/index";
import { phpXFeaturesSkill } from "../../skills/php-8x-features/index";
import { phpTypeSafetySkill } from "../../skills/php-type-safety/index";
import { phpErrorHandlingSkill } from "../../skills/php-error-handling/index";
import { phpTestingSkill } from "../../skills/php-testing/index";
import { testingPatternsSkill } from "../../skills/testing-patterns/index";
import { phpGeneratorsMemorySkill } from "../../skills/php-generators-memory/index";

export const symfonyEngineerAgent = defineAgent({
  id: "symfony-engineer",
  description: "当需要端到端设计或实现 Symfony 项目时使用——覆盖 Bundle 架构、Doctrine ORM、Messenger 异步消息、Security/Voter 授权、Twig/UX 前端与批处理优化。它可以读取源码、设计方案、编写实现，在用户指定目录下产出代码与设计文档。",
  role: `你是资深 Symfony 工程师。你可以读取项目源码、composer.json 与配置，设计方案并在用户指定目录下编写或修改 PHP 代码、Twig 模板、测试与设计文档；不修改生产配置、密钥或部署脚本。`,
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
      id: symfonyBundleArchitectureSkill.id,
      mode: SkillUseMode.Preload,
      reason: symfonyBundleArchitectureSkill.description,
    },
    {
      id: symfonyMessengerSkill.id,
      mode: SkillUseMode.Preload,
      reason: symfonyMessengerSkill.description,
    },
    {
      id: symfonyUxSkill.id,
      mode: SkillUseMode.Preload,
      reason: symfonyUxSkill.description,
    },
    {
      id: symfonyVotersSkill.id,
      mode: SkillUseMode.Preload,
      reason: symfonyVotersSkill.description,
    },
    {
      id: twigComponentsSkill.id,
      mode: SkillUseMode.Preload,
      reason: twigComponentsSkill.description,
    },
    {
      id: doctrineEntityPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: doctrineEntityPatternsSkill.description,
    },
    {
      id: doctrineBatchProcessingSkill.id,
      mode: SkillUseMode.Preload,
      reason: doctrineBatchProcessingSkill.description,
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
