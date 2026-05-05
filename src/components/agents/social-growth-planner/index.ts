import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { youtubeAnalysisSkill } from "../../skills/youtube-analysis/index";
import { youtubeSearchSkill } from "../../skills/youtube-search/index";
import { xiaohongshuCommercialGrowthSkill } from "../../skills/xiaohongshu-commercial-growth/index";
import { fanOperationsSkill } from "../../skills/fan-operations/index";
import { douyinViralContentSkill } from "../../skills/douyin-viral-content/index";
import { copywritingSkill } from "../../skills/copywriting/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const socialGrowthPlannerAgent = defineAgent({
  id: "social-growth-planner",
  description: "当需要设计社交媒体增长策略时使用。它综合个人品牌、平台内容、粉丝运营、私域、变现和平台安全，输出行动计划。",
  role: `你是资深社交媒体策略师。你只能读取、搜索和分析，不修改任何工作区文件。需要外部事实、竞品、市场、文档或时效性信息时，使用 WebSearch/WebFetch，并在结论中标注来源。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
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
      id: douyinViralContentSkill.id,
      mode: SkillUseMode.Preload,
      reason: douyinViralContentSkill.description,
    },
    {
      id: copywritingSkill.id,
      mode: SkillUseMode.Preload,
      reason: copywritingSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
