import {
  AgentSandbox,
  defineAgent,
  KnownTool,
  Platform,
  SkillUseMode,
} from "../../sdk";
import { croMethodologySkill } from "../../skills/cro-methodology/index";
import { redesignMyLandingpageSkill } from "../../skills/redesign-my-landingpage/index";
import { funnelArchitectSkill } from "../../skills/funnel-architect/index";
import { analyticsTrackingSkill } from "../../skills/analytics-tracking/index";
import { evidenceQualityFrameworkSkill } from "../../skills/evidence-quality-framework/index";

export const conversionOptimizerAgent = defineAgent({
  id: "conversion-optimizer",
  description: "当需要诊断或优化网站、落地页、注册流程、订阅流程、弹窗或 onboarding 的转化率，定位漏斗瓶颈并设计 CTA / 表单 / 弹窗实验时使用。",
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: croMethodologySkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: redesignMyLandingpageSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: funnelArchitectSkill.id,
      mode: SkillUseMode.Preload,
      reason: "Declared by agent frontmatter.",
    },
    {
      id: analyticsTrackingSkill.id,
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
