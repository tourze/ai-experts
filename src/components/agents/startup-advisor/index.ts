import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  defineWorkflow,
  defineWorkflowStep,
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
  role: `你是资深创业顾问。你只能读取、搜索和分析，不修改任何工作区文件。需要外部事实、竞品、市场、文档或时效性信息时，使用平台可用的联网搜索和网页读取能力，并在结论中标注来源。`,
  platforms: [Platform.Claude, Platform.Codex],
  workflow: defineWorkflow({
    direction: "TD",
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "识别阶段：idea、pre-seed、seed、Series A+ 或 growth。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "验证 problem-solution fit、ICP、TAM/SAM/SOM、商业模式、定价和渠道经济性。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "用联网搜索和网页读取验证市场规模、竞品、价格和基准指标。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "识别致命假设、证据缺口、阶段优先级和融资准备度。",
      }),
    ],
  }),
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
      reason: "锁定目标客户画像，支撑市场与定价判断。",
    },
    {
      id: startupViabilityChecklistSkill.id,
      mode: SkillUseMode.Preload,
      reason: "系统性排查项目可行性与致命风险。",
    },
    {
      id: marketSizingAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: "量化目标市场规模与增长预期。",
    },
    {
      id: businessModelSkill.id,
      mode: SkillUseMode.Preload,
      reason: "评估商业模式可行性与盈利路径。",
    },
    {
      id: businessHealthDiagnosticSkill.id,
      mode: SkillUseMode.Preload,
      reason: "诊断现有业务健康度与关键指标。",
    },
    {
      id: pricingStrategySkill.id,
      mode: SkillUseMode.Preload,
      reason: "制定定价策略与收费模型。",
    },
    {
      id: fundraiseAdvisorSkill.id,
      mode: SkillUseMode.Preload,
      reason: "规划融资轮次、估值与投资人沟通。",
    },
    {
      id: customerJourneyMapSkill.id,
      mode: SkillUseMode.Preload,
      reason: "绘制客户旅程，发现转化与留存断点。",
    },
    {
      id: planningUnderUncertaintySkill.id,
      mode: SkillUseMode.Preload,
      reason: "在高度不确定环境下做分阶段规划。",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "确保每条商业判断标注事实与推断边界。",
    }
  ],
});
