import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "field-evolution",
      source: new URL("./references/field-evolution.md", import.meta.url),
      target: "references/field-evolution.md",
      title: "field-evolution.md",
      summary: "Reference material for protocol-freezing-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "golden-file-testing",
      source: new URL("./references/golden-file-testing.md", import.meta.url),
      target: "references/golden-file-testing.md",
      title: "golden-file-testing.md",
      summary: "Reference material for protocol-freezing-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "version-negotiation",
      source: new URL("./references/version-negotiation.md", import.meta.url),
      target: "references/version-negotiation.md",
      title: "version-negotiation.md",
      summary: "Reference material for protocol-freezing-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "versioned-envelope",
      source: new URL("./references/versioned-envelope.md", import.meta.url),
      target: "references/versioned-envelope.md",
      title: "versioned-envelope.md",
      summary: "Reference material for protocol-freezing-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
