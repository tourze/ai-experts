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
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: portersFiveForcesSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: pricingStrategySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: competitiveIntelligenceSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: bcgMatrixSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: swotAnalysisSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: stpSegmentationSkill.id,
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
