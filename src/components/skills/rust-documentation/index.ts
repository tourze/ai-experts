import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const rustDocumentationSkill = defineSkill({
  id: "rust-documentation",
  fullName: "Rust 文档规范",
  description: "当用户要编写 Rust 公共 API 文档、配置 rustdoc lint、区分注释与文档、或补齐 Safety/Errors/Panics 段落时使用。",
  useCases: [
    "为公共 API 编写 `///` 文档。",
    "区分注释（`//` 解释 why）和文档（`///` 解释 what/how）。",
    "补齐 `# Safety`、`# Errors`、`# Panics`、`# Examples` 段落。",
    "配置 `#![warn(missing_docs)]` 或 `rustdoc` lint。",
  ],
  constraints: [
    "注释只解释\"为什么\"；代码应该自解释\"是什么\"。",
    "`///` 文档解释\"做什么、怎么用、失败条件\"。",
    "公共函数必须有文档；`# Errors` 列出返回 `Err` 的条件。",
    "`unsafe fn` 必须有 `# Safety` 段落说明调用方需满足的前置条件。",
    "可能 panic 的函数必须有 `# Panics` 段落。",
    "`# Examples` 中的代码块是可执行的文档测试——必须能编译通过。",
    "用 `//!` 写模块级文档，放在文件顶部。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "chapter-08",
      source: new URL("./references/chapter_08.md", import.meta.url),
      target: "references/chapter_08.md",
      title: "chapter_08.md",
      summary: "Reference material for rust-documentation.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
