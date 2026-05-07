import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先明确目标用户、任务目标、产品定位、业务约束和评审对象范围。",
      "判断主界面承担什么决策或行动，哪些状态最关键：空态、错态、加载、权限、危险操作或多角色协作。",
      "检查信息层级、反馈、信任证据、治理暴露和流程中断点，优先讲产品体验而不是视觉风格。",
      "需要创意验证、行业反模式、pitch、命名等专项判断时读取对应 reference。",
      "结合用户路径和竞争上下文时联动 `customer-journey-map` 或 `competitive-intelligence`。",
      "每条建议都说明提升了什么、牺牲了什么、为什么值得，以及预期行为变化。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "任务目标、主界面职责和关键状态清单。",
      "层级、反馈、空态/错态、信任和治理暴露问题。",
      "按严重度排序的设计批评和行为影响。",
      "建议、trade-off、验证方式和后续研究入口。",
    ],
  }),
  references: [
    defineReference({
      id: "idea-validator",
      source: new URL("./references/idea-validator.md", import.meta.url),
      target: "references/idea-validator.md",
      title: "idea-validator.md",
      summary: "产品创意验证框架，帮助判断设计想法是否值得推进。",
      loadWhen: "需要评估设计方案的可行性和有效性时读取。",
    }),
    defineReference({
      id: "industry-anti-patterns",
      source: new URL("./references/industry-anti-patterns.md", import.meta.url),
      target: "references/industry-anti-patterns.md",
      title: "industry-anti-patterns.md",
      summary: "产品设计中常见的行业反模式，说明哪些设计思路在实践中容易失败。",
      loadWhen: "需要避免产品设计中的常见陷阱或审查设计方案风险时读取。",
    }),
    defineReference({
      id: "pitch-deck-reviewer",
      source: new URL("./references/pitch-deck-reviewer.md", import.meta.url),
      target: "references/pitch-deck-reviewer.md",
      title: "pitch-deck-reviewer.md",
      summary: "产品提案评审指南，帮助评估产品方案的说服力和完整性。",
      loadWhen: "需要评审产品 pitch 或评估方案对外表达质量时读取。",
    }),
    defineReference({
      id: "product-naming",
      source: new URL("./references/product-naming.md", import.meta.url),
      target: "references/product-naming.md",
      title: "product-naming.md",
      summary: "产品命名原则与方法，包括品牌定位、市场沟通与命名决策流程。",
      loadWhen: "需要为产品或功能设计命名方案时读取。",
    }),
  ],
});
