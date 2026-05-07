import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { procedureUse, analyticsTrackingTrackingPlanGenerator } from "../../procedures/index";

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
  antiPatterns: [
    defineAntiPattern({
      fail: "全埋",
      pass: "业务漏斗驱动",
    }),
    defineAntiPattern({
      fail: "同义事件并存",
      pass: "命名 taxonomy + 迁移",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "规划、生成、审计或排查 GA4/GTM 埋点方案，围绕业务漏斗、事件 taxonomy、Consent、DebugView 和广告回传验证建立追踪计划。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先画业务漏斗、主转化、微转化、关键页面、用户属性和事件属性。",
      "使用 generator 时，输入至少包含 business_type、key_pages、conversion_actions、paid_channels 和 consent_required。",
      "事件命名先查 `event-taxonomy-guide`，GTM 容器设计查 `gtm-patterns`，排障查 `debugging-playbook`。",
      "方案层一次说明 Consent、内部流量过滤、跨域追踪、广告平台回传和验证路径。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "埋点计划、事件名、触发时机、参数、去重规则和负责人。",
      "Consent、DebugView、Preview、广告平台回传和跨域追踪验证路径。",
      "generator 输入 JSON 口径、事件 taxonomy 风险和迁移建议。",
    ],
  }),
  tools: [],
  procedures: [
    procedureUse(analyticsTrackingTrackingPlanGenerator),
  ],
  references: [
    defineReference({
      id: "campaign-analytics",
      source: new URL("./references/campaign-analytics.md", import.meta.url),
      target: "references/campaign-analytics.md",
      title: "campaign-analytics.md",
      summary: "Campaign 广告活动追踪参数配置与归因分析方法。",
      loadWhen: "需要配置广告活动追踪或排查归因数据异常时读取。",
    }),
    defineReference({
      id: "debugging-playbook",
      source: new URL("./references/debugging-playbook.md", import.meta.url),
      target: "references/debugging-playbook.md",
      title: "debugging-playbook.md",
      summary: "GA4/GTM 埋点调试手册：DebugView、Preview 与事件验证流程。",
      loadWhen: "需要排查事件在 Preview 中触发但 GA4 未收到或 Ads 未识别的问题时读取。",
    }),
    defineReference({
      id: "event-taxonomy-guide",
      source: new URL("./references/event-taxonomy-guide.md", import.meta.url),
      target: "references/event-taxonomy-guide.md",
      title: "event-taxonomy-guide.md",
      summary: "埋点事件命名规范与分类体系，确保事件命名稳定可复用。",
      loadWhen: "需要制定或审计事件命名规范，避免同义事件并存时读取。",
    }),
    defineReference({
      id: "gtm-patterns",
      source: new URL("./references/gtm-patterns.md", import.meta.url),
      target: "references/gtm-patterns.md",
      title: "gtm-patterns.md",
      summary: "Google Tag Manager 最佳实践：触发器、变量与标签组织模式。",
      loadWhen: "需要设计或优化 GTM 容器架构、排查事件不触发问题时读取。",
    }),
  ],
});
