import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { codeEngineerAgentFrameworkSkill } from "../../skills/code-engineer-agent-framework/index.js";
import { symfonyBundleArchitectureSkill } from "../../skills/symfony-bundle-architecture/index.js";
import { symfonyMessengerSkill } from "../../skills/symfony-messenger/index.js";
import { symfonyUxSkill } from "../../skills/symfony-ux/index.js";
import { symfonyVotersSkill } from "../../skills/symfony-voters/index.js";
import { twigComponentsSkill } from "../../skills/twig-components/index.js";
import { doctrineEntityPatternsSkill } from "../../skills/doctrine-entity-patterns/index.js";
import { doctrineBatchProcessingSkill } from "../../skills/doctrine-batch-processing/index.js";
import { phpDesignPatternsSkill } from "../../skills/php-design-patterns/index.js";
import { phpXFeaturesSkill } from "../../skills/php-8x-features/index.js";
import { phpTypeSafetySkill } from "../../skills/php-type-safety/index.js";
import { phpErrorHandlingSkill } from "../../skills/php-error-handling/index.js";
import { phpTestingSkill } from "../../skills/php-testing/index.js";
import { testingPatternsSkill } from "../../skills/testing-patterns/index.js";
import { phpGeneratorsMemorySkill } from "../../skills/php-generators-memory/index.js";

export const symfonyEngineerAgent = defineAgent({
  id: "symfony-engineer",
  description: "当需要端到端设计或实现 Symfony 项目时使用——覆盖 Bundle 架构、Doctrine ORM、Messenger 异步消息、Security/Voter 授权、Twig/UX 前端与批处理优化。它可以读取源码、设计方案、编写实现，在用户指定目录下产出代码与设计文档。",
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
      id: symfonyBundleArchitectureSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: symfonyMessengerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: symfonyUxSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: symfonyVotersSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: twigComponentsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: doctrineEntityPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: doctrineBatchProcessingSkill.id,
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
