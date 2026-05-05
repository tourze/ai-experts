import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { specDrivenDeliverySkill } from "../../skills/spec-driven-delivery/index.js";
import { speckitBaselineSkill } from "../../skills/speckit-baseline/index.js";
import { speckitConstitutionSkill } from "../../skills/speckit-constitution/index.js";
import { speckitSpecifySkill } from "../../skills/speckit-specify/index.js";
import { speckitClarifySkill } from "../../skills/speckit-clarify/index.js";
import { speckitQuizmeSkill } from "../../skills/speckit-quizme/index.js";
import { speckitChecklistSkill } from "../../skills/speckit-checklist/index.js";
import { speckitPlanSkill } from "../../skills/speckit-plan/index.js";
import { speckitTasksSkill } from "../../skills/speckit-tasks/index.js";
import { speckitTaskstoissuesSkill } from "../../skills/speckit-taskstoissues/index.js";
import { speckitImplementSkill } from "../../skills/speckit-implement/index.js";
import { speckitCheckerSkill } from "../../skills/speckit-checker/index.js";
import { speckitValidateSkill } from "../../skills/speckit-validate/index.js";
import { speckitAnalyzeSkill } from "../../skills/speckit-analyze/index.js";
import { speckitDiffSkill } from "../../skills/speckit-diff/index.js";
import { speckitStatusSkill } from "../../skills/speckit-status/index.js";
import { speckitReviewerSkill } from "../../skills/speckit-reviewer/index.js";

export const speckitDriverAgent = defineAgent({
  id: "speckit-driver",
  description: "当需要把一个特性从需求规格化、澄清、技术规划、任务拆解、实现到验证全程串起来时使用。它预加载 17 个 Spec Kit skill，按 Specify→Clarify→Plan→Tasks→Implement→Validate→Status 编排，并写入 spec/plan/tasks 等交付物。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: specDrivenDeliverySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: speckitBaselineSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: speckitConstitutionSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: speckitSpecifySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: speckitClarifySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: speckitQuizmeSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: speckitChecklistSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: speckitPlanSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: speckitTasksSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: speckitTaskstoissuesSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: speckitImplementSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: speckitCheckerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: speckitValidateSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: speckitAnalyzeSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: speckitDiffSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: speckitStatusSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: speckitReviewerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
