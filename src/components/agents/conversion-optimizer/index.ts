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
  role: `你是资深转化率优化顾问。你只做只读分析、产出实验假设与改造方案，不直接修改业务代码或埋点配置。`,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./AGENT.body.md", import.meta.url),
  qualityStandards: [
    "每条问题必须有可观测证据：转化率数字、热图、用户访谈、竞品对照或可视截图位置。",
    "实验必须可独立验证：不允许同时改多个变量而无法归因。",
    "区分「文案问题」「结构问题」「技术问题」「数据问题」，避免错误归责。",
    "对低流量场景给出最小样本量与替代方案（用户访谈、可用性测试），不强推统计实验。",
    "不假装跑过未运行的工具或访问过未触达的数据；缺数据要显式标注。",
  ],
  tools: [KnownTool.Read, KnownTool.Glob, KnownTool.Grep, KnownTool.WebSearch, KnownTool.WebFetch],
  sandbox: AgentSandbox.ReadOnly,
  skills: [
    {
      id: croMethodologySkill.id,
      mode: SkillUseMode.Preload,
      reason: croMethodologySkill.description,
    },
    {
      id: redesignMyLandingpageSkill.id,
      mode: SkillUseMode.Preload,
      reason: redesignMyLandingpageSkill.description,
    },
    {
      id: funnelArchitectSkill.id,
      mode: SkillUseMode.Preload,
      reason: funnelArchitectSkill.description,
    },
    {
      id: analyticsTrackingSkill.id,
      mode: SkillUseMode.Preload,
      reason: analyticsTrackingSkill.description,
    },
    {
      id: evidenceQualityFrameworkSkill.id,
      mode: SkillUseMode.Preload,
      reason: evidenceQualityFrameworkSkill.description,
    }
  ],
});
