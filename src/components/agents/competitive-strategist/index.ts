import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { portersFiveForcesSkill } from "../../skills/porters-five-forces/index";
import { pricingStrategySkill } from "../../skills/pricing-strategy/index";
import { competitiveIntelligenceSkill } from "../../skills/competitive-intelligence/index";
import { bcgMatrixSkill } from "../../skills/bcg-matrix/index";
import { swotAnalysisSkill } from "../../skills/swot-analysis/index";
import { stpSegmentationSkill } from "../../skills/stp-segmentation/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const competitiveStrategistAgent = defineAgent({
  id: "competitive-strategist",
  description: "当需要从行业结构、差异化定位、价格-价值多个角度综合分析竞争态势，且需要跨多个竞争框架交叉印证时使用。",
  role: `你是资深竞争策略顾问。你只能读取、搜索和分析，不修改任何工作区文件。需要外部事实、竞品、市场、文档或时效性信息时，使用 WebSearch/WebFetch，并在结论中标注来源。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "竞争策略分析：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "战略背景与决策点",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "行业结构（五力）",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "差异化与定位",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "价格-价值策略",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "竞品证据",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "战略建议与执行优先级",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
    ],
  }),
  qualityStandards: [
    "竞品判断必须引用产品页、定价页、财报或用户证据。",
    "框架冲突必须正面处理，不回避。",
    "建议必须能影响定位、定价或路线图决策。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: portersFiveForcesSkill.id,
      mode: SkillUseMode.Preload,
      reason: portersFiveForcesSkill.description,
    },
    {
      id: pricingStrategySkill.id,
      mode: SkillUseMode.Preload,
      reason: pricingStrategySkill.description,
    },
    {
      id: competitiveIntelligenceSkill.id,
      mode: SkillUseMode.Preload,
      reason: competitiveIntelligenceSkill.description,
    },
    {
      id: bcgMatrixSkill.id,
      mode: SkillUseMode.Preload,
      reason: bcgMatrixSkill.description,
    },
    {
      id: swotAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: swotAnalysisSkill.description,
    },
    {
      id: stpSegmentationSkill.id,
      mode: SkillUseMode.Preload,
      reason: stpSegmentationSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
