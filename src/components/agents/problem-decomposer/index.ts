import {
  AgentSandbox,
  defineAgent,
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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
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
