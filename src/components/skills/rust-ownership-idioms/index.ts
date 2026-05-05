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
  constraints: [
    "默认借用而非克隆。参数优先 `&str`、`&[T]`、`&Path`，除非调用方必须转移所有权。",
    "生产代码禁止把 `unwrap()` / `expect()` 当控制流；fail-fast 例外须写明原因。",
    "`clone()` 出现在循环内或热路径上时要质疑——往往是 API 边界设计错误的信号。",
    "选择分发：默认泛型静态分发；只有异构集合、插件边界或缩短编译时间时才转 `dyn Trait`。",
    "`TODO` 必须可追踪，如 `// TODO(#42): 移除兼容分支`。",
    "`#[allow(...)]` 优先替换为 `#[expect(...)]` 并写明原因。",
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
