import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
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
      summary: "Reference material for rust-proc-macro-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
