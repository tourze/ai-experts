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
      reason: "Declared by agent frontmatter.",
    },
    {
      id: systemsThinkingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: planningUnderUncertaintySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: runningDecisionProcessesSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: processOptimizationSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: mckinseyStepSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: fishboneDiagramSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: businessHealthDiagnosticSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: pdcaCycleSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: firstPrinciplesDecomposerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
