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

export const rustProcMacroPatternsSkill = defineSkill({
  id: "rust-proc-macro-patterns",
  fullName: "Rust Proc Macro Patterns",
  description: "当用户需要开发 Rust 过程宏时使用；涉及 derive macro、attribute macro、syn/quote 或 proc-macro2 时触发。",
  useCases: [
    "编写 derive macro 自动实现 trait。",
    "编写 attribute macro 注入日志、校验等代码。",
    "排查宏编译错误或 Span 定位不准。",
    "用 trybuild 编写编译通过/失败测试。",
  ],
  constraints: [
    "`[lib]` 设 `proc-macro = true`。",
    "用 syn 2.x + quote + proc-macro2。",
    "不 panic；错误用 `compile_error!` + 正确 Span。",
    "derive macro 只追加 impl，不修改原始 item。",
    "attribute macro 可修改 item，须文档说明。",
    "trybuild 覆盖通过和失败两类测试。",
    "核心逻辑放独立辅助 crate 方便单测。",
    "`cargo expand` 调试展开结果。",
  ],
  checklist: [
    "`proc-macro = true` 已设？用 syn 2.x？",
    "错误路径返回 `compile_error!` 而非 panic？Span 指向有意义位置？",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "宏内 panic",
      pass: "compile_error! + Span",
    }),
    defineAntiPattern({
      fail: "全用 call_site() Span",
      pass: "字段级 Span",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认宏类型、输入语法、生成代码边界、错误路径和测试策略。",
      "检查 `proc-macro = true`、syn 2.x / quote / proc-macro2 版本和核心逻辑拆分。",
      "所有错误返回 `compile_error!` 并绑定有意义 Span，不在宏内 panic。",
      "按需读取 `patterns` 中的 derive、attribute、Span 错误报告和 trybuild 模式。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "宏输入 / 输出设计、生成代码边界和 Span 错误策略。",
      "trybuild 通过 / 失败用例和 `cargo expand` 调试建议。",
      "需要引用的 `patterns` 模式与剩余宏语义风险。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "syn/quote 使用模式、Span 错误定位、trybuild 测试与辅助 crate 拆分策略。",
      loadWhen: "需要开发 derive/attribute 过程宏、排查宏编译错误或编写 trybuild 测试时读取。",
    }),
  ],
});
