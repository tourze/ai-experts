import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const rustErrorHandlingSkill = defineSkill({
  id: "rust-error-handling",
  description: "当用户要设计 Rust 错误类型、选择 thiserror 还是 anyhow、规范 Result 用法、消除 unwrap 或在 async 边界传播错误时使用。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for rust-error-handling.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
