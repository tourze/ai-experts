import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "Reference material for rust-serde-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
