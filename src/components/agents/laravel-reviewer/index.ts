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
  role: `你是资深 Laravel 工程师。只读审查，不修改文件。共享方法论见 code-review-agent-framework skill。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 只用于只读探测、版本查询、git 历史、文件统计或本 agent 明确允许的运行时检查。禁止安装依赖、删除/移动文件、运行破坏性命令，除非本 agent 在特定场景中明确允许。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeReviewAgentFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeReviewAgentFrameworkSkill.description,
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
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
