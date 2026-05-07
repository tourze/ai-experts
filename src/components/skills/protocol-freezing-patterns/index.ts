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

export const protocolFreezingPatternsSkill = defineSkill({
  id: "protocol-freezing-patterns",
  fullName: "protocol-freezing-patterns",
  description: "在需要管理协议版本冻结、线格式演进、向后兼容、版本协商和 breaking change 流程时使用。",
  useCases: [
    "需要冻结已部署协议字段或在不破坏旧客户端前提下演进消息结构。",
    "交叉引用：系统级设计配合 `system-design`；错误处理配合 `error-handling-patterns`。",
  ],
  constraints: [
    "已部署字段的线上表示不可变（类型、位置、编码）。",
    "新增字段必须可选且带默认值；旧客户端遇未知字段必须忽略。",
    "每条消息携带版本标签或版本化信封。",
    "删除字段走四阶段：标记废弃 -> 停写 -> 停读 -> 移除。",
    "破坏性变更必须升版本号；禁止同版本下变更语义。",
    "扩展点初始设计时预留；协议文档与代码同等冻结。",
    "保留每版本 golden file，新代码须能反序列化所有历史版本。",
  ],
  checklist: [
    "每条消息是否有版本标签。",
    "新增字段是否可选 + 默认值。",
    "废弃字段是否有四阶段计划。",
    "CI 是否运行历史 golden file 反序列化测试。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "偷改字段类型",
      pass: "升版本 + 新字段",
    }),
    defineAntiPattern({
      fail: "新增必填字段",
      pass: "新增可选 + 默认",
    }),
    defineAntiPattern({
      fail: "删字段直接移除",
      pass: "四阶段",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "在不破坏已部署客户端的前提下冻结协议线格式，并规划可回归测试的版本演进路径。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "盘点已部署消息、字段、编码、版本标签、客户端版本和兼容性承诺。",
      "判断本次变化属于新增、废弃、删除、语义调整还是线格式破坏；字段演进细节按需读取 `field-evolution` reference。",
      "为新增字段设计可选默认值，为删除字段制定标记废弃 -> 停写 -> 停读 -> 移除四阶段计划。",
      "设计版本标签、版本化信封或协商机制；需要方案时读取 `versioned-envelope` 和 `version-negotiation` references。",
      "为每个历史版本补 golden file 反序列化测试，测试方法按需读取 `golden-file-testing` reference。",
      "输出兼容性矩阵、迁移计划、测试清单和破坏性变更决策。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "协议版本与字段演进矩阵。",
      "兼容/不兼容变更判定和版本号策略。",
      "废弃或迁移阶段计划。",
      "Golden file 回归测试清单。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "field-evolution",
      source: new URL("./references/field-evolution.md", import.meta.url),
      target: "references/field-evolution.md",
      title: "field-evolution.md",
      summary: "协议字段演进策略，包括新增、废弃、删除字段的安全流程。",
      loadWhen: "需要安全地新增或废弃协议字段时读取。",
    }),
    defineReference({
      id: "golden-file-testing",
      source: new URL("./references/golden-file-testing.md", import.meta.url),
      target: "references/golden-file-testing.md",
      title: "golden-file-testing.md",
      summary: "Golden file 测试方法指南，保证新代码能反序列化所有历史版本。",
      loadWhen: "需要建立协议版本的反序列化回归测试时读取。",
    }),
    defineReference({
      id: "version-negotiation",
      source: new URL("./references/version-negotiation.md", import.meta.url),
      target: "references/version-negotiation.md",
      title: "version-negotiation.md",
      summary: "协议版本协商机制，包括版本标签设计、兼容性声明和升级流程。",
      loadWhen: "需要设计多版本协议客户端与服务端的版本协商策略时读取。",
    }),
    defineReference({
      id: "versioned-envelope",
      source: new URL("./references/versioned-envelope.md", import.meta.url),
      target: "references/versioned-envelope.md",
      title: "versioned-envelope.md",
      summary: "版本化信封模式设计，通过在消息外层包裹版本信息实现兼容演进。",
      loadWhen: "需要设计协议消息的版本化信封结构时读取。",
    }),
  ],
});
