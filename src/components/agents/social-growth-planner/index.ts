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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
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
      id: douyinViralContentSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: copywritingSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    }
  ],
});
