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

export const rustSerdePatternsSkill = defineSkill({
  id: "rust-serde-patterns",
  fullName: "Rust Serde Patterns",
  description: "当用户需要设计或调试 serde 序列化/反序列化逻辑时使用；涉及 serde derive 属性、enum 标签策略或自定义 Serializer 时触发。",
  useCases: [
    "设计 JSON/YAML/TOML 协议消息或配置的序列化方案。",
    "选择 enum 标签表示策略。",
    "不破坏已有数据地演进结构体字段。",
    "编写自定义序列化或反序列化时校验。",
  ],
  constraints: [
    "`deny_unknown_fields` 只用在 API 入口类型。",
    "枚举默认 `#[serde(tag = \"type\")]`（internally tagged）。",
    "重命名后保留 `#[serde(alias = \"old_name\")]`。",
    "新增字段用 `#[serde(default)]` 或 `Option<T>`。",
    "自定义 Deserialize 返回错误不 panic。",
    "`flatten` 有性能开销，热路径慎用。",
    "二进制协议用 `#[serde(with = \"...\")]` 自定义编码。",
  ],
  checklist: [
    "enum 标签策略明确？`deny_unknown_fields` 只在入口？",
    "重命名保留 alias？新增字段有 default/Option？",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "所有类型 deny_unknown_fields",
      pass: "只在 API 入口用",
    }),
    defineAntiPattern({
      fail: "重命名不加 alias",
      pass: "保留 alias",
    }),
    defineAntiPattern({
      fail: "Deserialize panic",
      pass: "返回错误",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "设计和调试 Rust serde 序列化 / 反序列化方案，保持 enum 标签、字段演进、自定义编码和校验逻辑可兼容。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认数据格式、兼容性要求、enum 标签策略、未知字段策略和热路径性能要求。",
      "检查新增字段是否有 default / Option，重命名字段是否保留 alias，Deserialize 是否返回错误而非 panic。",
      "只在 API 入口使用 `deny_unknown_fields`，热路径谨慎使用 `flatten`。",
      "按需读取 `patterns` 中的 internally tagged enum、结构体演进、Duration 编码和校验模式。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "serde 属性方案、enum 标签策略和字段兼容性计划。",
      "自定义序列化 / 反序列化校验与错误处理建议。",
      "需要引用的 `patterns` 模式和兼容性风险。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "enum 标签策略、字段演进兼容性、flatten 开销分析与自定义序列化器模式。",
      loadWhen: "需要设计 serde 序列化方案、选择 enum 标签策略或编写自定义 Deserialize 时读取。",
    }),
  ],
});
