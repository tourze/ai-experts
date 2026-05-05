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
      reason: "Declared by agent frontmatter.",
    },
    {
      id: complexityReducerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: refactoringChecklistSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: debugMethodologySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: preLandingReviewSkill.id,
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
