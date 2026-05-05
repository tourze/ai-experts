import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index";
import { doctrineBatchProcessingSkill } from "../../skills/doctrine-batch-processing/index";
import { doctrineEntityPatternsSkill } from "../../skills/doctrine-entity-patterns/index";
import { symfonyBundleArchitectureSkill } from "../../skills/symfony-bundle-architecture/index";
import { symfonyMessengerSkill } from "../../skills/symfony-messenger/index";
import { symfonyVotersSkill } from "../../skills/symfony-voters/index";
import { symfonyUxSkill } from "../../skills/symfony-ux/index";
import { twigComponentsSkill } from "../../skills/twig-components/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const symfonyReviewerAgent = defineAgent({
  id: "symfony-reviewer",
  description: "当需要只读审查 Symfony DI、Service、Doctrine、Messenger、Event、Security/Voter 和 Twig/UX 时使用。",
  role: `你是资深 Symfony 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
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
      id: doctrineBatchProcessingSkill.id,
      mode: SkillUseMode.Preload,
      reason: doctrineBatchProcessingSkill.description,
    },
    {
      id: doctrineEntityPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: doctrineEntityPatternsSkill.description,
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
      id: symfonyVotersSkill.id,
      mode: SkillUseMode.Preload,
      reason: symfonyVotersSkill.description,
    },
    {
      id: symfonyUxSkill.id,
      mode: SkillUseMode.Preload,
      reason: symfonyUxSkill.description,
    },
    {
      id: twigComponentsSkill.id,
      mode: SkillUseMode.Preload,
      reason: twigComponentsSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
