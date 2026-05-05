import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
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
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "创业项目评估：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "创业背景",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "框架选择",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "框架分析",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "跨框架综合",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "判断与建议",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
    ],
  }),
  qualityStandards: [
    "大 TAM 和“没有竞品”的说法必须验证。",
    "融资建议要包含轮次、稀释、投资人预期和材料缺口。",
    "SaaS 指标必须使用精确定义。",
    "直说生存风险，不用鼓励掩盖事实。",
  ],
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
