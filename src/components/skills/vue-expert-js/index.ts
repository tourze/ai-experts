import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const vueExpertJsSkill = defineSkill({
  id: "vue-expert-js",
  fullName: "Vue Expert（JavaScript）",
  description: "当用户用 JavaScript 编写 Vue 3、Pinia、composable、JSDoc 或 Vite 相关代码时使用。",
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
      summary: "Reference material for vue-expert-js.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "composables-patterns",
      source: new URL("./references/composables-patterns.md", import.meta.url),
      target: "references/composables-patterns.md",
      title: "composables-patterns.md",
      summary: "Reference material for vue-expert-js.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "jsdoc-typing",
      source: new URL("./references/jsdoc-typing.md", import.meta.url),
      target: "references/jsdoc-typing.md",
      title: "jsdoc-typing.md",
      summary: "Reference material for vue-expert-js.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "state-management",
      source: new URL("./references/state-management.md", import.meta.url),
      target: "references/state-management.md",
      title: "state-management.md",
      summary: "Reference material for vue-expert-js.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "testing-patterns",
      source: new URL("./references/testing-patterns.md", import.meta.url),
      target: "references/testing-patterns.md",
      title: "testing-patterns.md",
      summary: "Reference material for vue-expert-js.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for vue-expert-js.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
