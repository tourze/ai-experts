import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
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
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "营销活动方案：<活动名称>",
    sections: [
      defineAgentOutputSection({
        title: "活动概述",
        body: "[目标 / 预算 / 周期 / 核心受众 / 主 KPI]",
      }),
      defineAgentOutputSection({
        title: "市场定位",
        body: "[细分市场 / 目标人群画像 / 价值主张 / 竞争格局]",
      }),
      defineAgentOutputSection({
        title: "内容策略",
        body: "[内容支柱 / 选题池 / SEO 关键词矩阵 / 平台适配方案]",
      }),
      defineAgentOutputSection({
        title: "文案交付",
        body: "[核心文案 / 各平台变体 / Hook 与 CTA 策略]",
      }),
      defineAgentOutputSection({
        title: "投放计划",
        body: "[渠道组合 / 预算分配 / 受众定向 / 素材矩阵 / 出价策略]",
      }),
      defineAgentOutputSection({
        title: "转化路径",
        body: "[落地页结构 / 漏斗环节 / CRO 实验队列]",
      }),
      defineAgentOutputSection({
        title: "度量框架",
        body: "[事件定义 / 归因模型 / 效果看板 / 迭代节奏]",
      }),
      defineAgentOutputSection({
        title: "时间线与分工",
        body: "[里程碑 / 责任矩阵 / 依赖关系]",
      }),
      defineAgentOutputSection({
        title: "风险预案",
        body: "[平台政策 / 预算超支 / 转化不达预期 / 负面反馈]",
      }),
    ],
  }),
  bashBoundary: [
    "Bash 用于读取项目文件、运行分析脚本和 git 操作。网络搜索用 WebSearch/WebFetch。禁止操作广告账户、发布内容到平台、修改生产环境追踪代码。",
  ],
  qualityStandards: [
    "定位必须基于可验证的市场数据和用户研究，不凭经验假设。",
    "每条渠道建议必须说明 ROI 预期、资源成本和起量周期。",
    "文案必须有明确的 Hook 策略和 CTA，不允许泛泛而谈。",
    "SEO 建议必须有搜索量和竞争度判断，不凭空推荐关键词。",
    "投放计划必须包含受众分层和素材 A/B 方案，不写通用模板。",
    "度量体系必须覆盖从曝光到留存的完整链路，不遗漏中间环节。",
    "预算分配必须说明各渠道占比理由和调整触发条件。",
  ],
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
