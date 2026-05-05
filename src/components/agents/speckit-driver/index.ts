import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  defineAgentWorkflow,
  defineAgentWorkflowStep,
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
  workflow: defineAgentWorkflow({
    direction: "TD",
    steps: [
      defineAgentWorkflowStep({
        id: "step-1",
        label: "先确认用户目标、特性范围、所在分支与既有 .specify/ 状态。",
      }),
      defineAgentWorkflowStep({
        id: "step-2",
        label: "用 spec-driven-delivery 设定外层纪律：10 分 spec 门禁、.sparv/journal.md 持续记录、3 次失败停下问人、高风险显式确认。",
      }),
      defineAgentWorkflowStep({
        id: "step-3",
        label: `按阶段委派 speckit 子 skill，不混阶段执行：
 - Specify → speckit-baseline（必要时初始化）+ speckit-specify
 - Clarify → speckit-clarify + speckit-quizme + speckit-checklist
 - Plan → speckit-plan（必要时 speckit-constitution）
 - Tasks → speckit-tasks（可选 speckit-taskstoissues）
 - Implement → speckit-implement + speckit-checker
 - Validate → speckit-validate + speckit-analyze
 - Track → speckit-status + speckit-diff + speckit-reviewer`,
      }),
      defineAgentWorkflowStep({
        id: "step-4",
        label: "每跨一个阶段先回读上阶段产物，确保 spec→plan→tasks→impl→validate 链路无信息丢失。",
      }),
      defineAgentWorkflowStep({
        id: "step-5",
        label: "任一阶段证据不足或出现高风险变更时停下确认，不静默推进。",
      }),
    ],
  }),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "Spec Kit 交付报告：<feature>",
    sections: [
      defineAgentOutputSection({
        title: "当前阶段",
        body: "[Specify / Clarify / Plan / Tasks / Implement / Validate / Done，给出依据]",
      }),
      defineAgentOutputSection({
        title: "交付物清单",
        body: "[列出已写入的 spec/plan/tasks/checklist 等文件路径与本轮变更点]",
      }),
      defineAgentOutputSection({
        title: "阶段回放",
        body: "[按阶段列出本轮决策、消歧记录、关键 trade-off]",
      }),
      defineAgentOutputSection({
        title: "阻塞与歧义",
        body: "[未解决的 NEEDS_CLARIFICATION、缺失文档、回归风险]",
      }),
      defineAgentOutputSection({
        title: "下一步",
        body: "[下一阶段动作、验证命令、需要用户确认项]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 用于运行 `.specify/scripts/*` 脚本、测试命令、git 历史与状态查询、文件统计；禁止安装依赖、删除 `.specify/` 之外的工作区文件，或运行破坏性命令。Implement 阶段执行用户授权的构建/测试命令前必须先回显该命令。",
  ],
  qualityStandards: [
    "每个阶段切换必须有可验证产物（文件路径 + 关键内容摘要）。",
    "严禁跳阶段：Plan 前必须有合格 spec，Implement 前必须有合格 tasks，Validate 前必须有可运行实现。",
    "高风险变更（公共契约、schema、并发、跨模块）必须显式列出并等待确认。",
    "失败 3 次的环节按 spec-driven-delivery 协议升级停下问人，不连环重试。",
    "不在交付报告之外修改任何与本特性无关的文件。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: specDrivenDeliverySkill.id,
      mode: SkillUseMode.Preload,
      reason: "设定规格驱动交付纪律，作为整体编排骨架。",
    },
    {
      id: speckitBaselineSkill.id,
      mode: SkillUseMode.Preload,
      reason: "必要时初始化 .specify/ 目录与基线结构。",
    },
    {
      id: speckitConstitutionSkill.id,
      mode: SkillUseMode.Preload,
      reason: "定义项目级规格约束与设计宪法。",
    },
    {
      id: speckitSpecifySkill.id,
      mode: SkillUseMode.Preload,
      reason: "驱动 Specify 阶段产出需求规格文件。",
    },
    {
      id: speckitClarifySkill.id,
      mode: SkillUseMode.Preload,
      reason: "驱动 Clarify 阶段消歧与需求澄清。",
    },
    {
      id: speckitQuizmeSkill.id,
      mode: SkillUseMode.Preload,
      reason: "通过自测问答验证规格理解完整度。",
    },
    {
      id: speckitChecklistSkill.id,
      mode: SkillUseMode.Preload,
      reason: "生成规格完整性检查清单。",
    },
    {
      id: speckitPlanSkill.id,
      mode: SkillUseMode.Preload,
      reason: "驱动 Plan 阶段产出技术实施方案。",
    },
    {
      id: speckitTasksSkill.id,
      mode: SkillUseMode.Preload,
      reason: "驱动 Tasks 阶段拆解可执行任务列表。",
    },
    {
      id: speckitTaskstoissuesSkill.id,
      mode: SkillUseMode.Preload,
      reason: "将任务列表同步为 GitHub Issues。",
    },
    {
      id: speckitImplementSkill.id,
      mode: SkillUseMode.Preload,
      reason: "驱动 Implement 阶段执行编码实现。",
    },
    {
      id: speckitCheckerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "实现阶段自动检查产物与规格一致性。",
    },
    {
      id: speckitValidateSkill.id,
      mode: SkillUseMode.Preload,
      reason: "驱动 Validate 阶段验证实现与规格对齐。",
    },
    {
      id: speckitAnalyzeSkill.id,
      mode: SkillUseMode.Preload,
      reason: "分析实现产物与规格的偏差。",
    },
    {
      id: speckitDiffSkill.id,
      mode: SkillUseMode.Preload,
      reason: "对比规格与实现的增量差异。",
    },
    {
      id: speckitStatusSkill.id,
      mode: SkillUseMode.Preload,
      reason: "汇总各阶段进展状态。",
    },
    {
      id: speckitReviewerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "最终审查交付物质量与规格合规性。",
    }
  ],
});
