import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const designSystemPatternsSkill = defineSkill({
  id: "design-system-patterns",
  description: "当用户需要搭建设计令牌、主题系统或组件架构时使用。适合涉及”设计系统””design tokens””主题切换””组件库规范””多品牌主题”的场景。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "component-architecture",
      source: new URL("./references/component-architecture.md", import.meta.url),
      target: "references/component-architecture.md",
      title: "component-architecture.md",
      summary: "Reference material for design-system-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "design-tokens",
      source: new URL("./references/design-tokens.md", import.meta.url),
      target: "references/design-tokens.md",
      title: "design-tokens.md",
      summary: "Reference material for design-system-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "master-overrides-pattern",
      source: new URL("./references/master-overrides-pattern.md", import.meta.url),
      target: "references/master-overrides-pattern.md",
      title: "master-overrides-pattern.md",
      summary: "Reference material for design-system-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "tailwind-design-system",
      source: new URL("./references/tailwind-design-system.md", import.meta.url),
      target: "references/tailwind-design-system.md",
      title: "tailwind-design-system.md",
      summary: "Reference material for design-system-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "theming-architecture",
      source: new URL("./references/theming-architecture.md", import.meta.url),
      target: "references/theming-architecture.md",
      title: "theming-architecture.md",
      summary: "Reference material for design-system-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for design-system-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
