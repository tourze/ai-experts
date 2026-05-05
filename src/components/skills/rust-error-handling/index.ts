import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const rustErrorHandlingSkill = defineSkill({
  id: "rust-error-handling",
  fullName: "Rust 错误处理",
  description: "当用户要设计 Rust 错误类型、选择 thiserror 还是 anyhow、规范 Result 用法、消除 unwrap 或在 async 边界传播错误时使用。",
  useCases: [
    "设计库或应用的错误类型层级。",
    "在 thiserror（库）和 anyhow（二进制入口）之间做选择。",
    "消除生产代码中的 `unwrap()` / `expect()`。",
    "在 async 边界正确传播和转换错误。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "chapter-04",
      source: new URL("./references/chapter_04.md", import.meta.url),
      target: "references/chapter_04.md",
      title: "chapter_04.md",
      summary: "Reference material for rust-error-handling.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
