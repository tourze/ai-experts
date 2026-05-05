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
import { structuredProblemDecompositionSkill } from "../../skills/structured-problem-decomposition/index";
import { systemsThinkingSkill } from "../../skills/systems-thinking/index";
import { planningUnderUncertaintySkill } from "../../skills/planning-under-uncertainty/index";
import { runningDecisionProcessesSkill } from "../../skills/running-decision-processes/index";
import { processOptimizationSkill } from "../../skills/process-optimization/index";
import { mckinseyStepSkill } from "../../skills/mckinsey-7-step/index";
import { fishboneDiagramSkill } from "../../skills/fishbone-diagram/index";
import { businessHealthDiagnosticSkill } from "../../skills/business-health-diagnostic/index";
import { pdcaCycleSkill } from "../../skills/pdca-cycle/index";
import { firstPrinciplesDecomposerSkill } from "../../skills/first-principles-decomposer/index";

export const problemDecomposerAgent = defineAgent({
  id: "problem-decomposer",
  description: "当业务问题复杂、根因不明，且需要结构化拆解、根因分析、决策推进、改进闭环多步骤综合处理时使用。",
  role: `你是资深问题拆解顾问。你只能读取、搜索和分析，不修改任何工作区文件。需要外部事实、竞品、市场、文档或时效性信息时，使用 WebSearch/WebFetch，并在结论中标注来源。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineAgentWorkflow({
    direction: "TD",
    steps: [
      defineAgentWorkflowStep({
        id: "step-1",
        label: "按 structured-problem-decomposition 的六阶段流水线推进：问题界定 → 结构化拆解 → 根因分析 → 系统动态 → 决策推进 → PDCA 闭环。各阶段过渡标准和红旗见该 skill 主表。需要外部信息时先搜再分析。",
      }),
    ],
  }),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "问题拆解：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "5W2H 问题描述",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "七步法子问题树",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "根因候选（鱼骨）",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "系统结构与反馈回路",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "范围收敛与决策路径",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "PDCA 改进闭环",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
    ],
  }),
  qualityStandards: [
    "每个根因候选必须标注证据强度和反证方式。",
    "不可证伪的归因必须显式降级。",
    "决策建议必须可触发、可回退。",
    "跨框架冲突必须正面解释，不简单堆叠。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: structuredProblemDecompositionSkill.id,
      mode: SkillUseMode.Preload,
      reason: structuredProblemDecompositionSkill.description,
    },
    {
      id: systemsThinkingSkill.id,
      mode: SkillUseMode.Preload,
      reason: systemsThinkingSkill.description,
    },
    {
      id: planningUnderUncertaintySkill.id,
      mode: SkillUseMode.Preload,
      reason: planningUnderUncertaintySkill.description,
    },
    {
      id: runningDecisionProcessesSkill.id,
      mode: SkillUseMode.Preload,
      reason: runningDecisionProcessesSkill.description,
    },
    {
      id: processOptimizationSkill.id,
      mode: SkillUseMode.Preload,
      reason: processOptimizationSkill.description,
    },
    {
      id: mckinseyStepSkill.id,
      mode: SkillUseMode.Preload,
      reason: mckinseyStepSkill.description,
    },
    {
      id: fishboneDiagramSkill.id,
      mode: SkillUseMode.Preload,
      reason: fishboneDiagramSkill.description,
    },
    {
      id: businessHealthDiagnosticSkill.id,
      mode: SkillUseMode.Preload,
      reason: businessHealthDiagnosticSkill.description,
    },
    {
      id: pdcaCycleSkill.id,
      mode: SkillUseMode.Preload,
      reason: pdcaCycleSkill.description,
    },
    {
      id: firstPrinciplesDecomposerSkill.id,
      mode: SkillUseMode.Preload,
      reason: firstPrinciplesDecomposerSkill.description,
    }
  ],
});
