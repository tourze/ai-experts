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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for rust-documentation.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
