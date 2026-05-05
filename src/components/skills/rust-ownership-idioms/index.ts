import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const rustOwnershipIdiomsSkill = defineSkill({
  id: "rust-ownership-idioms",
  fullName: "Rust 所有权与惯用法",
  description: "当需要决定 Rust 借用/所有权边界、选择 Box/Rc/Arc 智能指针、在静态分发与 `dyn Trait` 之间取舍、或配置 Clippy lint 基线时使用。",
  useCases: [
    "新写 Rust 模块、函数、trait 或类型时，需要先定借用/所有权边界。",
    "评审中判断 `.clone()`、`unwrap()`、`Box`、`Rc`、`Arc`、`dyn Trait` 是否合理。",
    "选择 `&T` vs `T` vs `Box<T>` vs `Rc<T>` vs `Arc<T>` 时需要决策依据。",
    "配置 Clippy lint 基线或处理 Clippy 警告时。",
  ],
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
  ],
});
