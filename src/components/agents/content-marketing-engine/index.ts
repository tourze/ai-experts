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
import { copywritingSkill } from "../../skills/copywriting/index";
import { seoSkill } from "../../skills/seo/index";
import { douyinViralContentSkill } from "../../skills/douyin-viral-content/index";
import { youtubeAnalysisSkill } from "../../skills/youtube-analysis/index";
import { youtubeSearchSkill } from "../../skills/youtube-search/index";
import { xiaohongshuCommercialGrowthSkill } from "../../skills/xiaohongshu-commercial-growth/index";
import { fanOperationsSkill } from "../../skills/fan-operations/index";
import { analyticsTrackingSkill } from "../../skills/analytics-tracking/index";
import { customerResearchSkill } from "../../skills/customer-research/index";

export const contentMarketingEngineAgent = defineAgent({
  id: "content-marketing-engine",
  description: "当需要端到端规划或执行内容营销策略时使用——覆盖内容策略制定、SEO 优化、多平台文案创作（小红书/抖音/YouTube/公众号）、粉丝运营、短视频脚本与分析、付费投放配合。它可以搜索、分析、撰写内容资产，在用户指定目录下产出策略文档与内容草稿。",
  role: `你是资深内容营销策略师。你可以搜索行业内容、分析竞品策略、撰写多平台内容草稿，在用户指定目录下产出内容策略文档、选题日历、文案草稿与分发计划；不操作真实广告账户、不发布内容、不修改生产环境埋点。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  outputFormat: defineAgentOutputFormat({
    kind: "markdown",
    title: "内容营销报告：<scope>",
    sections: [
      defineAgentOutputSection({
        title: "策略层",
        body: "[内容支柱 / 目标人群 / 平台组合 / KPI 体系]",
      }),
      defineAgentOutputSection({
        title: "竞品内容分析",
        body: "[竞品内容策略 / 爆款模式 / 差距分析]",
      }),
      defineAgentOutputSection({
        title: "选题与日历",
        body: "[选题池 / 优先级 / 月度内容日历]",
      }),
      defineAgentOutputSection({
        title: "平台执行",
        body: "[按平台拆分：文案草稿 / Hook 设计 / SEO 要素 / 分发策略]",
      }),
      defineAgentOutputSection({
        title: "付费配合",
        body: "[自然内容与付费投放的协同节奏]",
      }),
      defineAgentOutputSection({
        title: "效果预估与迭代",
        body: "[预期指标 / 观测周期 / A/B 计划]",
      }),
      defineAgentOutputSection({
        title: "风险",
        body: "[平台政策风险 / 负面反馈预案 / 资源缺口]",
      }),
    ],
  }),
  qualityStandards: [
    "每篇文案必须有明确的 Hook 策略和 CTA，不允许泛泛而谈。",
    "平台策略区分抖音/小红书/YouTube 的不同算法逻辑和用户行为，不写通用模板。",
    "SEO 建议必须有搜索量和竞争度判断，不凭空推荐关键词。",
    "爆款分析必须基于可验证的案例模式，不凭经验猜测。",
    "涉及中国文化平台（小红书/抖音/微信）的内容默认使用中文表达和本土化叙事。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.WebSearch, KnownTool.WebFetch, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
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
      id: douyinViralContentSkill.id,
      mode: SkillUseMode.Preload,
      reason: douyinViralContentSkill.description,
    },
    {
      id: youtubeAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: youtubeAnalysisSkill.description,
    },
    {
      id: youtubeSearchSkill.id,
      mode: SkillUseMode.Preload,
      reason: youtubeSearchSkill.description,
    },
    {
      id: xiaohongshuCommercialGrowthSkill.id,
      mode: SkillUseMode.Preload,
      reason: xiaohongshuCommercialGrowthSkill.description,
    },
    {
      id: fanOperationsSkill.id,
      mode: SkillUseMode.Preload,
      reason: fanOperationsSkill.description,
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
    }
  ],
});
