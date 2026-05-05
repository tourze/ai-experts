import {
  AgentSandbox,
  defineAgent,
  defineAgentOutputFormat,
  defineAgentOutputSection,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { contentStrategySkill } from "../../skills/content-strategy/index";
import { seoSkill } from "../../skills/seo/index";
import { leadChannelOptimizerSkill } from "../../skills/lead-channel-optimizer/index";
import { croMethodologySkill } from "../../skills/cro-methodology/index";
import { paidAdsSkill } from "../../skills/paid-ads/index";
import { analyticsTrackingSkill } from "../../skills/analytics-tracking/index";
import { customerResearchSkill } from "../../skills/customer-research/index";
import { stpSegmentationSkill } from "../../skills/stp-segmentation/index";
import { funnelArchitectSkill } from "../../skills/funnel-architect/index";
import { revopsSkill } from "../../skills/revops/index";
import { leadResearchAssistantSkill } from "../../skills/lead-research-assistant/index";
import { customerLifecycleSkill } from "../../skills/customer-lifecycle/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const acquisitionStrategistAgent = defineAgent({
  id: "acquisition-strategist",
  description: "当需要端到端规划获客与转化，且涉及渠道、SEO、内容、CRO、付费、推荐、analytics 多模块协同时使用。",
  role: `你是资深获客策略师。你只能读取、搜索和分析，不修改任何工作区文件。需要外部事实、竞品、市场、文档或时效性信息时，使用 WebSearch/WebFetch，并在结论中标注来源。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "获客蓝图：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "现状分析",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "增长模型",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "渠道策略",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "内容与 SEO 计划",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "转化优化",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "付费策略",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "推荐与病毒机制",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "跨框架综合",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "测量计划",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
      defineAgentOutputSection({
        title: "90 天路线图",
        body: "[用中文填写，保留必要的英文技术标识符]",
      }),
    ],
  }),
  qualityStandards: [
    "每个渠道建议必须说明 ROI 预期和资源成本。",
    "每条建议必须对应漏斗阶段。",
    "必须展示框架之间的依赖和复利关系。",
    "缺数据时明确假设和验证方式。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: contentStrategySkill.id,
      mode: SkillUseMode.Preload,
      reason: contentStrategySkill.description,
    },
    {
      id: seoSkill.id,
      mode: SkillUseMode.Preload,
      reason: seoSkill.description,
    },
    {
      id: leadChannelOptimizerSkill.id,
      mode: SkillUseMode.Preload,
      reason: leadChannelOptimizerSkill.description,
    },
    {
      id: croMethodologySkill.id,
      mode: SkillUseMode.Preload,
      reason: croMethodologySkill.description,
    },
    {
      id: paidAdsSkill.id,
      mode: SkillUseMode.Preload,
      reason: paidAdsSkill.description,
    },
    {
      id: analyticsTrackingSkill.id,
      mode: SkillUseMode.Preload,
      reason: analyticsTrackingSkill.description,
    },
    {
      id: customerResearchSkill.id,
      mode: SkillUseMode.Preload,
      reason: customerResearchSkill.description,
    },
    {
      id: stpSegmentationSkill.id,
      mode: SkillUseMode.Preload,
      reason: stpSegmentationSkill.description,
    },
    {
      id: funnelArchitectSkill.id,
      mode: SkillUseMode.Preload,
      reason: funnelArchitectSkill.description,
    },
    {
      id: revopsSkill.id,
      mode: SkillUseMode.Preload,
      reason: revopsSkill.description,
    },
    {
      id: leadResearchAssistantSkill.id,
      mode: SkillUseMode.Preload,
      reason: leadResearchAssistantSkill.description,
    },
    {
      id: customerLifecycleSkill.id,
      mode: SkillUseMode.Preload,
      reason: customerLifecycleSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
