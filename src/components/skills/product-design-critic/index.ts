import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { competitiveIntelligenceSkill } from "../competitive-intelligence/index";
import { customerJourneyMapSkill } from "../customer-journey-map/index";

export const productDesignCriticSkill = defineSkill({
  id: "product-design-critic",
  fullName: "产品设计批评",
  description: "当用户要批判性审视软件产品界面、交互流程、信息层级、信任感或治理暴露时使用（产品策略级设计审视）。像素级 UI 实现质量审查用 `frontend-design-review`；交互可用性启发式诊断用 `ux-heuristics`。",
  useCases: [
    "评审页面、工作流、卡片、配置面板、聊天体验或多角色治理界面。",
    "需要结合用户路径和竞争上下文时，可配合 `customer-journey-map`、`obviously-awesome` 与 `competitive-teardown`。",
  ],
  constraints: [
    "先讲用户任务、关键决策和风险暴露，再讲样式层建议。",
    "输出要说明 trade-off：提升了什么、牺牲了什么、为什么值得。",
    "评审对象是产品体验，不是单独某个像素或视觉趋势。",
  ],
  checklist: [
    "已明确目标用户、关键任务与最危险状态。",
    "建议覆盖层级、反馈、空态/错态与信任设计。",
    "每条建议都能落到行为变化，而不是抽象审美。",
    "与产品定位和业务约束不冲突。",
  ],
  relatedSkills: [
    {
      get id() {
        return competitiveIntelligenceSkill.id;
      },
      label: "obviously-awesome",
      reason: "需要结合用户路径和竞争上下文时，可配合 `customer-journey-map`、`obviously-awesome` 与 `competitive-teardown`。",
    },
    {
      get id() {
        return competitiveIntelligenceSkill.id;
      },
      label: "competitive-teardown",
      reason: "需要结合用户路径和竞争上下文时，可配合 `customer-journey-map`、`obviously-awesome` 与 `competitive-teardown`。",
    },
    {
      get id() {
        return customerJourneyMapSkill.id;
      },
      reason: "需要结合用户路径和竞争上下文时，可配合 `customer-journey-map`、`obviously-awesome` 与 `competitive-teardown`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "抽象审美词",
      pass: "落到行为变化",
    }),
    defineAntiPattern({
      fail: "只改视觉",
      pass: "先架构再视觉",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "idea-validator",
      source: new URL("./references/idea-validator.md", import.meta.url),
      target: "references/idea-validator.md",
      title: "idea-validator.md",
      summary: "Reference material for product-design-critic.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "industry-anti-patterns",
      source: new URL("./references/industry-anti-patterns.md", import.meta.url),
      target: "references/industry-anti-patterns.md",
      title: "industry-anti-patterns.md",
      summary: "Reference material for product-design-critic.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "pitch-deck-reviewer",
      source: new URL("./references/pitch-deck-reviewer.md", import.meta.url),
      target: "references/pitch-deck-reviewer.md",
      title: "pitch-deck-reviewer.md",
      summary: "Reference material for product-design-critic.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "product-naming",
      source: new URL("./references/product-naming.md", import.meta.url),
      target: "references/product-naming.md",
      title: "product-naming.md",
      summary: "Reference material for product-design-critic.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
