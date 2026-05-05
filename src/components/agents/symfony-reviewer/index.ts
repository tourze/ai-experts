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
      id: doctrineBatchProcessingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: doctrineEntityPatternsSkill.id,
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
      id: symfonyVotersSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: symfonyUxSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: twigComponentsSkill.id,
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
