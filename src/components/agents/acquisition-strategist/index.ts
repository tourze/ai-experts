import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk.js";
import { contentStrategySkill } from "../../skills/content-strategy/index.js";
import { seoSkill } from "../../skills/seo/index.js";
import { leadChannelOptimizerSkill } from "../../skills/lead-channel-optimizer/index.js";
import { croMethodologySkill } from "../../skills/cro-methodology/index.js";
import { paidAdsSkill } from "../../skills/paid-ads/index.js";
import { analyticsTrackingSkill } from "../../skills/analytics-tracking/index.js";
import { customerResearchSkill } from "../../skills/customer-research/index.js";
import { stpSegmentationSkill } from "../../skills/stp-segmentation/index.js";
import { funnelArchitectSkill } from "../../skills/funnel-architect/index.js";
import { revopsSkill } from "../../skills/revops/index.js";
import { leadResearchAssistantSkill } from "../../skills/lead-research-assistant/index.js";
import { customerLifecycleSkill } from "../../skills/customer-lifecycle/index.js";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index.js";

export const acquisitionStrategistAgent = defineAgent({
  id: "acquisition-strategist",
  description: "当需要端到端规划获客与转化，且涉及渠道、SEO、内容、CRO、付费、推荐、analytics 多模块协同时使用。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: contentStrategySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: seoSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: leadChannelOptimizerSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: croMethodologySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: paidAdsSkill.id,
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
    },
    {
      id: stpSegmentationSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: funnelArchitectSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: revopsSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: leadResearchAssistantSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: customerLifecycleSkill.id,
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
