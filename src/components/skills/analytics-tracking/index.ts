import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
  defineSkillScript,
  defineSkillScriptRoot,
} from "../../sdk";

export const analyticsTrackingSkill = defineSkill({
  id: "analytics-tracking",
  fullName: "埋点与追踪（analytics-tracking）",
  description: "在需要规划、审计或排查 GA4/GTM 埋点时使用。",
  useCases: [
    "从零搭建 GA4 / GTM 埋点方案。",
    "审计现有事件是否漏记、重记、命名混乱或参数失真。",
    "排查“Preview 里触发了，但 GA4 没收 / Ads 没认”的问题。",
  ],
  constraints: [
    "事件命名必须稳定且可复用，优先遵循 [event-taxonomy-guide](references/event-taxonomy-guide.md)。",
    "先画业务漏斗和关键转化，再决定事件与参数，不要先埋再想用途。",
    "Consent、内部流量过滤、跨域追踪要在方案层面一次说明，不能等上线后补洞。",
  ],
  checklist: [
    "是否列出了主转化、微转化、用户属性和事件属性。",
    "是否说明每个事件的触发时机、去重规则和负责人。",
    "是否覆盖 Consent、DebugView、Preview、广告平台回传的验证路径。",
    "是否避免了同义事件并存，例如 `signup_complete` 与 `signup_completed`。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  scriptRoots: [
    defineSkillScriptRoot({
      source: new URL("./scripts/", import.meta.url),
      target: "scripts",
    }),
  ],
  scripts: [
    defineSkillScript({
      id: "tracking-plan-generator",
      entry: new URL("./scripts/tracking_plan_generator.mjs", import.meta.url),
      target: "scripts/tracking_plan_generator.mjs",
      runtime: "node",
      bundle: false,
      description: "Script tracking_plan_generator.mjs.",
    })
  ],
  references: [
    defineReference({
      id: "campaign-analytics",
      source: new URL("./references/campaign-analytics.md", import.meta.url),
      target: "references/campaign-analytics.md",
      title: "campaign-analytics.md",
      summary: "Reference material for analytics-tracking.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "debugging-playbook",
      source: new URL("./references/debugging-playbook.md", import.meta.url),
      target: "references/debugging-playbook.md",
      title: "debugging-playbook.md",
      summary: "Reference material for analytics-tracking.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "event-taxonomy-guide",
      source: new URL("./references/event-taxonomy-guide.md", import.meta.url),
      target: "references/event-taxonomy-guide.md",
      title: "event-taxonomy-guide.md",
      summary: "Reference material for analytics-tracking.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "gtm-patterns",
      source: new URL("./references/gtm-patterns.md", import.meta.url),
      target: "references/gtm-patterns.md",
      title: "gtm-patterns.md",
      summary: "Reference material for analytics-tracking.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
