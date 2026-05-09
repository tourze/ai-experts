import {
  InvocationPolicy,
  Platform,
  defineAsset,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
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
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先画业务漏斗、主转化、微转化、关键页面、用户属性和事件属性。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "使用 generator 时，输入至少包含 business_type、key_pages、conversion_actions、paid_channels 和 consent_required。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "事件命名先查 `event-taxonomy-guide`，GTM 容器设计查 `gtm-patterns`，排障查 `debugging-playbook`。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "方案层一次说明 Consent、内部流量过滤、跨域追踪、广告平台回传和验证路径。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "埋点计划、事件名、触发时机、参数、去重规则和负责人。",
      "Consent、DebugView、Preview、广告平台回传和跨域追踪验证路径。",
      "generator 输入 JSON 口径、事件 taxonomy 风险和迁移建议。",
    ],
  }),
  procedures: [
    procedureUse(analyticsTrackingTrackingPlanGenerator, {
      label: "生成埋点方案",
      when: "需要从零搭建 GA4/GTM 埋点计划或审计现有事件时。",
      reason: "自动生成结构化事件分类、GTM 配置和维度建议，避免从零手写完整埋点方案。",
    }),
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
      id: "attribution-models-guide",
      source: new URL("./references/attribution-models-guide.md", import.meta.url),
      target: "references/attribution-models-guide.md",
      title: "attribution-models-guide.md",
      summary: "多触点归因模型选择、口径限制和解释方式。",
      loadWhen: "需要比较 first-touch、last-touch、linear、time-decay 或 position-based 归因时读取。",
    }),
    defineReference({
      id: "campaign-metrics-benchmarks",
      source: new URL("./references/campaign-metrics-benchmarks.md", import.meta.url),
      target: "references/campaign-metrics-benchmarks.md",
      title: "campaign-metrics-benchmarks.md",
      summary: "活动分析常用指标、计算公式和口径校验清单。",
      loadWhen: "需要解释 ROI、ROAS、CPA、CPL、CAC 或跨渠道指标差异时读取。",
    }),
    defineReference({
      id: "funnel-optimization-framework",
      source: new URL("./references/funnel-optimization-framework.md", import.meta.url),
      target: "references/funnel-optimization-framework.md",
      title: "funnel-optimization-framework.md",
      summary: "按漏斗阶段定位瓶颈并转化为实验建议的方法。",
      loadWhen: "需要从 visit、signup、activation、paid 等阶段定位流失和实验优先级时读取。",
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
  assets: [
    defineAsset({
      id: "sample-campaign-data",
      source: new URL("./assets/sample_campaign_data.json", import.meta.url),
      target: "assets/sample_campaign_data.json",
    }),
  ],
});
