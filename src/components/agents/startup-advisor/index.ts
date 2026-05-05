import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { startupIcpDefinerSkill } from "../../skills/startup-icp-definer/index";
import { startupViabilityChecklistSkill } from "../../skills/startup-viability-checklist/index";
import { marketSizingAnalysisSkill } from "../../skills/market-sizing-analysis/index";
import { businessModelSkill } from "../../skills/business-model/index";
import { businessHealthDiagnosticSkill } from "../../skills/business-health-diagnostic/index";
import { pricingStrategySkill } from "../../skills/pricing-strategy/index";
import { fundraiseAdvisorSkill } from "../../skills/fundraise-advisor/index";
import { customerJourneyMapSkill } from "../../skills/customer-journey-map/index";
import { planningUnderUncertaintySkill } from "../../skills/planning-under-uncertainty/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const startupAdvisorAgent = defineAgent({
  id: "startup-advisor",
  description: "当创业项目需要从想法验证、ICP、市场规模、商业模式、定价、渠道到融资准备做整体评估时使用。它预加载 10 个商业和融资框架。",
  role: `你是资深创业顾问。你只能读取、搜索和分析，不修改任何工作区文件。需要外部事实、竞品、市场、文档或时效性信息时，使用 WebSearch/WebFetch，并在结论中标注来源。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: startupIcpDefinerSkill.id,
      mode: SkillUseMode.Preload,
      reason: startupIcpDefinerSkill.description,
    },
    {
      id: startupViabilityChecklistSkill.id,
      mode: SkillUseMode.Preload,
      reason: startupViabilityChecklistSkill.description,
    },
    {
      id: marketSizingAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: marketSizingAnalysisSkill.description,
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
      id: pricingStrategySkill.id,
      mode: SkillUseMode.Preload,
      reason: pricingStrategySkill.description,
    },
    {
      id: fundraiseAdvisorSkill.id,
      mode: SkillUseMode.Preload,
      reason: fundraiseAdvisorSkill.description,
    },
    {
      id: customerJourneyMapSkill.id,
      mode: SkillUseMode.Preload,
      reason: customerJourneyMapSkill.description,
    },
    {
      id: planningUnderUncertaintySkill.id,
      mode: SkillUseMode.Preload,
      reason: planningUnderUncertaintySkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
