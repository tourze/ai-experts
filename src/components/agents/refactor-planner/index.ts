import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { refactoringPatternsSkill } from "../../skills/refactoring-patterns/index.js";
import { refactorPlanningMethodSkill } from "../../skills/refactor-planning-method/index.js";
import { complexityReducerSkill } from "../../skills/complexity-reducer/index.js";
import { techDebtSkill } from "../../skills/tech-debt/index.js";
import { errorHandlingPatternsSkill } from "../../skills/error-handling-patterns/index.js";
import { softwareDesignSkill } from "../../skills/software-design/index.js";
import { pragmaticProgrammerSkill } from "../../skills/pragmatic-programmer/index.js";
import { featureDevSkill } from "../../skills/feature-dev/index.js";
import { planReviewSkill } from "../../skills/plan-review/index.js";
import { brainstormingBeforeCodingSkill } from "../../skills/brainstorming-before-coding/index.js";

export const refactorPlannerAgent = defineAgent({
  id: "refactor-planner",
  description: "当需要为既有代码制定重构计划，识别坏味、技术债、复杂度热点、缝隙与扩展点，并把改动拆成可独立验证的步骤时使用。它可以写入重构计划文档与 PR 拆分建议，不直接修改业务代码。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: refactoringPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: refactorPlanningMethodSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: complexityReducerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: techDebtSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: errorHandlingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: softwareDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: pragmaticProgrammerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: featureDevSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: planReviewSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: brainstormingBeforeCodingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
