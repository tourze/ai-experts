import {
  AgentSandbox,
  defineAgent,
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
