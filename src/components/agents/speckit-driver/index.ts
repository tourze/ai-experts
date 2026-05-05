import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { specDrivenDeliverySkill } from "../../skills/spec-driven-delivery/index";
import { speckitBaselineSkill } from "../../skills/speckit-baseline/index";
import { speckitConstitutionSkill } from "../../skills/speckit-constitution/index";
import { speckitSpecifySkill } from "../../skills/speckit-specify/index";
import { speckitClarifySkill } from "../../skills/speckit-clarify/index";
import { speckitQuizmeSkill } from "../../skills/speckit-quizme/index";
import { speckitChecklistSkill } from "../../skills/speckit-checklist/index";
import { speckitPlanSkill } from "../../skills/speckit-plan/index";
import { speckitTasksSkill } from "../../skills/speckit-tasks/index";
import { speckitTaskstoissuesSkill } from "../../skills/speckit-taskstoissues/index";
import { speckitImplementSkill } from "../../skills/speckit-implement/index";
import { speckitCheckerSkill } from "../../skills/speckit-checker/index";
import { speckitValidateSkill } from "../../skills/speckit-validate/index";
import { speckitAnalyzeSkill } from "../../skills/speckit-analyze/index";
import { speckitDiffSkill } from "../../skills/speckit-diff/index";
import { speckitStatusSkill } from "../../skills/speckit-status/index";
import { speckitReviewerSkill } from "../../skills/speckit-reviewer/index";

export const speckitDriverAgent = defineAgent({
  id: "speckit-driver",
  description: "当需要把一个特性从需求规格化、澄清、技术规划、任务拆解、实现到验证全程串起来时使用。它预加载 17 个 Spec Kit skill，按 Specify→Clarify→Plan→Tasks→Implement→Validate→Status 编排，并写入 spec/plan/tasks 等交付物。",
  role: `你是资深规格驱动交付负责人。你可以在用户请求的交付范围内创建或更新 \`.specify/\` 与特性目录下的规格、计划、任务、清单等文件，但不要修改与本特性无关的源码、配置或用户数据。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  bashBoundary: [
    "Bash 用于运行 `.specify/scripts/*` 脚本、测试命令、git 历史与状态查询、文件统计；禁止安装依赖、删除 `.specify/` 之外的工作区文件，或运行破坏性命令。Implement 阶段执行用户授权的构建/测试命令前必须先回显该命令。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: specDrivenDeliverySkill.id,
      mode: SkillUseMode.Preload,
      reason: specDrivenDeliverySkill.description,
    },
    {
      id: speckitBaselineSkill.id,
      mode: SkillUseMode.Preload,
      reason: speckitBaselineSkill.description,
    },
    {
      id: speckitConstitutionSkill.id,
      mode: SkillUseMode.Preload,
      reason: speckitConstitutionSkill.description,
    },
    {
      id: speckitSpecifySkill.id,
      mode: SkillUseMode.Preload,
      reason: speckitSpecifySkill.description,
    },
    {
      id: speckitClarifySkill.id,
      mode: SkillUseMode.Preload,
      reason: speckitClarifySkill.description,
    },
    {
      id: speckitQuizmeSkill.id,
      mode: SkillUseMode.Preload,
      reason: speckitQuizmeSkill.description,
    },
    {
      id: speckitChecklistSkill.id,
      mode: SkillUseMode.Preload,
      reason: speckitChecklistSkill.description,
    },
    {
      id: speckitPlanSkill.id,
      mode: SkillUseMode.Preload,
      reason: speckitPlanSkill.description,
    },
    {
      id: speckitTasksSkill.id,
      mode: SkillUseMode.Preload,
      reason: speckitTasksSkill.description,
    },
    {
      id: speckitTaskstoissuesSkill.id,
      mode: SkillUseMode.Preload,
      reason: speckitTaskstoissuesSkill.description,
    },
    {
      id: speckitImplementSkill.id,
      mode: SkillUseMode.Preload,
      reason: speckitImplementSkill.description,
    },
    {
      id: speckitCheckerSkill.id,
      mode: SkillUseMode.Preload,
      reason: speckitCheckerSkill.description,
    },
    {
      id: speckitValidateSkill.id,
      mode: SkillUseMode.Preload,
      reason: speckitValidateSkill.description,
    },
    {
      id: speckitAnalyzeSkill.id,
      mode: SkillUseMode.Preload,
      reason: speckitAnalyzeSkill.description,
    },
    {
      id: speckitDiffSkill.id,
      mode: SkillUseMode.Preload,
      reason: speckitDiffSkill.description,
    },
    {
      id: speckitStatusSkill.id,
      mode: SkillUseMode.Preload,
      reason: speckitStatusSkill.description,
    },
    {
      id: speckitReviewerSkill.id,
      mode: SkillUseMode.Preload,
      reason: speckitReviewerSkill.description,
    }
  ],
});
