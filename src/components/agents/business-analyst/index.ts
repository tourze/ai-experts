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
  role: `你是资深商业分析顾问。你可以在 \`docs/analysis/\` 或用户指定目录下创建或更新商业分析报告；不修改产品代码、营销资产、能力配置或安装脚本。需要外部事实、竞品、市场、文档或时效性信息时，使用 WebSearch/WebFetch，并在结论中标注来源和日期。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Write, KnownTool.Edit, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: financialAnalystSkill.id,
      mode: SkillUseMode.Preload,
      reason: financialAnalystSkill.description,
    },
    {
      id: mckinseyStepSkill.id,
      mode: SkillUseMode.Preload,
      reason: mckinseyStepSkill.description,
    },
    {
      id: structuredBusinessAnalysisFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: structuredBusinessAnalysisFrameworkSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    },
    {
      id: pestelAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: pestelAnalysisSkill.description,
    },
    {
      id: portersFiveForcesSkill.id,
      mode: SkillUseMode.Preload,
      reason: portersFiveForcesSkill.description,
    },
    {
      id: businessModelSkill.id,
      mode: SkillUseMode.Preload,
      reason: businessModelSkill.description,
    },
    {
      id: businessHealthDiagnosticSkill.id,
      mode: SkillUseMode.Preload,
      reason: businessHealthDiagnosticSkill.description,
    },
    {
      id: customerResearchSkill.id,
      mode: SkillUseMode.Preload,
      reason: customerResearchSkill.description,
    },
    {
      id: dataAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: dataAnalysisSkill.description,
    }
  ],
});
