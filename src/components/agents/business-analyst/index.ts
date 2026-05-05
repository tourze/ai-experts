import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { financialAnalystSkill } from "../../skills/financial-analyst/index";
import { mckinseyStepSkill } from "../../skills/mckinsey-7-step/index";
import { structuredBusinessAnalysisFrameworkSkill } from "../../skills/structured-business-analysis-framework/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";
import { pestelAnalysisSkill } from "../../skills/pestel-analysis/index";
import { portersFiveForcesSkill } from "../../skills/porters-five-forces/index";
import { businessModelSkill } from "../../skills/business-model/index";
import { businessHealthDiagnosticSkill } from "../../skills/business-health-diagnostic/index";
import { customerResearchSkill } from "../../skills/customer-research/index";
import { dataAnalysisSkill } from "../../skills/data-analysis/index";

export const businessAnalystAgent = defineAgent({
  id: "business-analyst",
  description: "当需要把开放式商业问题转成结构化分析报告，且必须串联问题界定、假设树、数据验证、模型选择和行动建议时使用。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Write, KnownTool.Edit, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: financialAnalystSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: mckinseyStepSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: structuredBusinessAnalysisFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: pestelAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: portersFiveForcesSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: businessModelSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: businessHealthDiagnosticSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: customerResearchSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: dataAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
