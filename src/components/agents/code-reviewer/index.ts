import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { codeReviewSkill } from "../../skills/code-review/index";
import { complexityReducerSkill } from "../../skills/complexity-reducer/index";
import { refactoringChecklistSkill } from "../../skills/refactoring-checklist/index";
import { debugMethodologySkill } from "../../skills/debug-methodology/index";
import { preLandingReviewSkill } from "../../skills/pre-landing-review/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const codeReviewerAgent = defineAgent({
  id: "code-reviewer",
  description: "当需要通用只读代码审查时使用。它检查正确性、命名、错误处理、设计结构、一致性和可维护性，不修改文件。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: codeReviewSkill.id,
      mode: SkillUseMode.Preload,
      reason: codeReviewSkill.description,
    },
    {
      id: complexityReducerSkill.id,
      mode: SkillUseMode.Preload,
      reason: complexityReducerSkill.description,
    },
    {
      id: refactoringChecklistSkill.id,
      mode: SkillUseMode.Preload,
      reason: refactoringChecklistSkill.description,
    },
    {
      id: debugMethodologySkill.id,
      mode: SkillUseMode.Preload,
      reason: debugMethodologySkill.description,
    },
    {
      id: preLandingReviewSkill.id,
      mode: SkillUseMode.Preload,
      reason: preLandingReviewSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
