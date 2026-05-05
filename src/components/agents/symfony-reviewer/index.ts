import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index.js";
import { doctrineBatchProcessingSkill } from "../../skills/doctrine-batch-processing/index.js";
import { doctrineEntityPatternsSkill } from "../../skills/doctrine-entity-patterns/index.js";
import { symfonyBundleArchitectureSkill } from "../../skills/symfony-bundle-architecture/index.js";
import { symfonyMessengerSkill } from "../../skills/symfony-messenger/index.js";
import { symfonyVotersSkill } from "../../skills/symfony-voters/index.js";
import { symfonyUxSkill } from "../../skills/symfony-ux/index.js";
import { twigComponentsSkill } from "../../skills/twig-components/index.js";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index.js";

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
