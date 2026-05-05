import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { refactoringPatternsSkill } from "../../skills/refactoring-patterns/index";
import { refactorPlanningMethodSkill } from "../../skills/refactor-planning-method/index";
import { complexityReducerSkill } from "../../skills/complexity-reducer/index";
import { techDebtSkill } from "../../skills/tech-debt/index";
import { errorHandlingPatternsSkill } from "../../skills/error-handling-patterns/index";
import { softwareDesignSkill } from "../../skills/software-design/index";
import { pragmaticProgrammerSkill } from "../../skills/pragmatic-programmer/index";
import { featureDevSkill } from "../../skills/feature-dev/index";
import { planReviewSkill } from "../../skills/plan-review/index";
import { brainstormingBeforeCodingSkill } from "../../skills/brainstorming-before-coding/index";

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
      reason: refactoringPatternsSkill.description,
    },
    {
      id: refactorPlanningMethodSkill.id,
      mode: SkillUseMode.Preload,
      reason: refactorPlanningMethodSkill.description,
    },
    {
      id: complexityReducerSkill.id,
      mode: SkillUseMode.Preload,
      reason: complexityReducerSkill.description,
    },
    {
      id: techDebtSkill.id,
      mode: SkillUseMode.Preload,
      reason: techDebtSkill.description,
    },
    {
      id: errorHandlingPatternsSkill.id,
      mode: SkillUseMode.Preload,
      reason: errorHandlingPatternsSkill.description,
    },
    {
      id: softwareDesignSkill.id,
      mode: SkillUseMode.Preload,
      reason: softwareDesignSkill.description,
    },
    {
      id: pragmaticProgrammerSkill.id,
      mode: SkillUseMode.Preload,
      reason: pragmaticProgrammerSkill.description,
    },
    {
      id: featureDevSkill.id,
      mode: SkillUseMode.Preload,
      reason: featureDevSkill.description,
    },
    {
      id: planReviewSkill.id,
      mode: SkillUseMode.Preload,
      reason: planReviewSkill.description,
    },
    {
      id: brainstormingBeforeCodingSkill.id,
      mode: SkillUseMode.Preload,
      reason: brainstormingBeforeCodingSkill.description,
    }
  ],
});
