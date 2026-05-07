import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const techDebtSkill = defineSkill({
  id: "tech-debt",
  fullName: "tech-debt",
  description: "在需要盘点代码健康状况、识别和排序技术债、制定治理策略、重构路线图或债务预算时使用。",
  useCases: [
    "适合代码健康盘点、重构优先级排序和维护 backlog 整理。",
    "适合回答“先还哪些债最划算、为什么”。",
    "适合遗留系统治理、重构路线图、债务预算争取和版本节奏协调。",
    "交叉引用：落到代码整改时配合 `complexity-reducer` 或 `refactoring-patterns`。",
  ],
  constraints: [
    "债项必须归类：代码、架构、测试、依赖、文档、基础设施。",
    "排序时至少考虑影响、风险、工作量，不能凭印象排。",
    "每条债务都要给业务理由，而不是只给技术洁癖理由。",
    "治理建议要能并入正常迭代，而不是永远挂在 backlog。",
    "不要把所有代码不喜欢的地方都归类成必须立刻偿还的债。",
    "需要明确债务 owner、验证指标和退出条件。",
  ],
  checklist: [
    "是否把债项分类并绑定具体模块。",
    "是否解释不修会带来的业务或工程后果。",
    "是否按统一评分规则排过序。",
    "是否给出分期治理建议、owner、衡量指标和退出条件。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "全 P0",
      pass: "公式排序",
    }),
    defineAntiPattern({
      fail: "只列不治理",
      pass: "配置每迭代预算",
    }),
    defineAntiPattern({
      fail: "喊重写",
      pass: "分期治理",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先收集债项并按代码、架构、测试、依赖、文档、基础设施分类；债项多时先按模块或领域分组。",
      "为每条债务写清不修的业务或工程后果、影响范围、风险和 owner。",
      "用默认优先级公式 `(影响 + 风险) × (6 - 工作量)` 排序，不把所有不喜欢的代码都标成 P0。",
      "需要治理视角或组织案例时读取 `guest-insights` reference。",
      "把建议切成立即止血、近期治理、长期重构三层，并说明建议时机和迭代预算。",
      "为每项治理定义收益、验证指标、退出条件和可回滚路径。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "债项清单、类型、模块、owner 和业务/工程后果。",
      "影响、风险、工作量评分和排序依据。",
      "立即止血、近期治理、长期重构三层路线图。",
      "收益、验证方式、退出条件和迭代预算建议。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "guest-insights",
      source: new URL("./references/guest-insights.md", import.meta.url),
      target: "references/guest-insights.md",
      title: "guest-insights.md",
      summary: "技术债治理的外部视角总结，包含案例分析、常见误区和治理经验。",
      loadWhen: "需要参考外部案例来制定技术债治理策略或评估债务影响时读取。",
    }),
  ],
});
