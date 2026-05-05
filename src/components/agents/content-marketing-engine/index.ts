import {
  AgentSandbox,
  defineAgent,
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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.WebSearch, KnownTool.WebFetch, KnownTool.Write, KnownTool.Edit],
  sandbox: AgentSandbox.WorkspaceWrite,
  skills: [
    {
      id: contentStrategySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: copywritingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: seoSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: douyinViralContentSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: youtubeAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: youtubeSearchSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: xiaohongshuCommercialGrowthSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: fanOperationsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: analyticsTrackingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: customerResearchSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
