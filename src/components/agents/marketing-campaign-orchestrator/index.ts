import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { stpSegmentationSkill } from "../../skills/stp-segmentation/index";
import { customerResearchSkill } from "../../skills/customer-research/index";
import { contentStrategySkill } from "../../skills/content-strategy/index";
import { copywritingSkill } from "../../skills/copywriting/index";
import { seoSkill } from "../../skills/seo/index";
import { paidAdsSkill } from "../../skills/paid-ads/index";
import { croMethodologySkill } from "../../skills/cro-methodology/index";
import { analyticsTrackingSkill } from "../../skills/analytics-tracking/index";
import { marketingPlanSkill } from "../../skills/marketing-plan/index";

export const marketingCampaignOrchestratorAgent = defineAgent({
  id: "marketing-campaign-orchestrator",
  description: "当需要端到端规划并落地一场营销活动时使用——从市场定位（STP）、用户研究、内容策略、SEO、付费投放到转化优化与效果度量。它能在用户指定目录下产出完整的营销活动方案、文案草稿、投放计划和度量框架。与 acquisition-strategist（只读获客诊断）和 content-marketing-engine（聚焦内容侧）互补，覆盖完整营销活动全生命周期。",
  role: `你是资深营销活动策划师。你可以搜索行业数据、分析竞品、在用户指定目录下产出完整的营销活动方案、文案草稿、投放计划和度量框架；不操作真实广告账户、不发布内容、不修改生产环境埋点。需要外部事实、竞品、市场或时效性信息时，使用 WebSearch/WebFetch，并在结论中标注来源。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.Bash, KnownTool.Write, KnownTool.Edit, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: stpSegmentationSkill.id,
      mode: SkillUseMode.Preload,
      reason: stpSegmentationSkill.description,
    },
    {
      id: customerResearchSkill.id,
      mode: SkillUseMode.Preload,
      reason: customerResearchSkill.description,
    },
    {
      id: contentStrategySkill.id,
      mode: SkillUseMode.Preload,
      reason: contentStrategySkill.description,
    },
    {
      id: copywritingSkill.id,
      mode: SkillUseMode.Preload,
      reason: copywritingSkill.description,
    },
    {
      id: seoSkill.id,
      mode: SkillUseMode.Preload,
      reason: seoSkill.description,
    },
    {
      id: paidAdsSkill.id,
      mode: SkillUseMode.Preload,
      reason: paidAdsSkill.description,
    },
    {
      id: croMethodologySkill.id,
      mode: SkillUseMode.Preload,
      reason: croMethodologySkill.description,
    },
    {
      id: analyticsTrackingSkill.id,
      mode: SkillUseMode.Preload,
      reason: analyticsTrackingSkill.description,
    },
    {
      id: marketingPlanSkill.id,
      mode: SkillUseMode.Preload,
      reason: marketingPlanSkill.description,
    }
  ],
});
