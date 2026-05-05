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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for rust-type-design.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
