import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const rustOwnershipIdiomsSkill = defineSkill({
  id: "rust-ownership-idioms",
  description: "当需要决定 Rust 借用/所有权边界、选择 Box/Rc/Arc 智能指针、在静态分发与 `dyn Trait` 之间取舍、或配置 Clippy lint 基线时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "chapter-01",
      source: new URL("./references/chapter_01.md", import.meta.url),
      target: "references/chapter_01.md",
      title: "chapter_01.md",
      summary: "Reference material for rust-ownership-idioms.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "chapter-02",
      source: new URL("./references/chapter_02.md", import.meta.url),
      target: "references/chapter_02.md",
      title: "chapter_02.md",
      summary: "Reference material for rust-ownership-idioms.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "chapter-09",
      source: new URL("./references/chapter_09.md", import.meta.url),
      target: "references/chapter_09.md",
      title: "chapter_09.md",
      summary: "Reference material for rust-ownership-idioms.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for rust-ownership-idioms.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
