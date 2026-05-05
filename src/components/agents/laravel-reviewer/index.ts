import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewAgentFrameworkSkill } from "../../skills/code-review-agent-framework/index";
import { laravelPatternsSkill } from "../../skills/laravel-patterns/index";
import { laravelSecuritySkill } from "../../skills/laravel-security/index";
import { laravelVerificationSkill } from "../../skills/laravel-verification/index";
import { laravelTddSkill } from "../../skills/laravel-tdd/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const laravelReviewerAgent = defineAgent({
  id: "laravel-reviewer",
  description: "当需要只读审查 Laravel 分层、Eloquent、Validation、Authorization、Migration 和 Queue 时使用。",
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
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
