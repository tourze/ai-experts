import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const rustTypeDesignSkill = defineSkill({
  id: "rust-type-design",
  fullName: "Rust 类型设计",
  description: "当用户要在泛型与 trait object 之间做选择、设计静态/动态分发边界、或用类型状态模式把非法状态变成编译错误时使用。",
  useCases: [
    "选择泛型（静态分发）还是 `dyn Trait`（动态分发）。",
    "设计 trait object 的 object safety 约束。",
    "用类型状态模式（typestate）把非法操作顺序变成编译错误。",
    "在编译时间、二进制大小和运行时性能之间做权衡。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "chapter-06",
      source: new URL("./references/chapter_06.md", import.meta.url),
      target: "references/chapter_06.md",
      title: "chapter_06.md",
      summary: "Reference material for rust-type-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "chapter-07",
      source: new URL("./references/chapter_07.md", import.meta.url),
      target: "references/chapter_07.md",
      title: "chapter_07.md",
      summary: "Reference material for rust-type-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
