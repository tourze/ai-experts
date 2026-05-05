import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const crossPlatformAdapterPatternsSkill = defineSkill({
  id: "cross-platform-adapter-patterns",
  description: "在设计跨平台应用的平台抽象层、适配器接口、运行时分支和 monorepo 组织时使用。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "adapter-interface",
      source: new URL("./references/adapter-interface.md", import.meta.url),
      target: "references/adapter-interface.md",
      title: "adapter-interface.md",
      summary: "Reference material for cross-platform-adapter-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "di-container",
      source: new URL("./references/di-container.md", import.meta.url),
      target: "references/di-container.md",
      title: "di-container.md",
      summary: "Reference material for cross-platform-adapter-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "monorepo-layout",
      source: new URL("./references/monorepo-layout.md", import.meta.url),
      target: "references/monorepo-layout.md",
      title: "monorepo-layout.md",
      summary: "Reference material for cross-platform-adapter-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "rust-cfg-abstraction",
      source: new URL("./references/rust-cfg-abstraction.md", import.meta.url),
      target: "references/rust-cfg-abstraction.md",
      title: "rust-cfg-abstraction.md",
      summary: "Reference material for cross-platform-adapter-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for cross-platform-adapter-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
