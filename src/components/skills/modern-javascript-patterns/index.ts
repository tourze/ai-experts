import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk.js";

export const modernJavascriptPatternsSkill = defineSkill({
  id: "modern-javascript-patterns",
  description: "当需要用现代 ES6+ 特性重构旧代码、编写可维护 JavaScript 或优化 JS 热路径性能时使用。用户提到微优化、Set/Map 查找、循环优化、DOM 批处理、requestIdleCallback 时触发。",
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Reference material for modern-javascript-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "micro-optimization-rules",
      source: new URL("./references/micro-optimization-rules/", import.meta.url),
      target: "references/micro-optimization-rules",
      title: "micro-optimization-rules",
      summary: "Reference material for modern-javascript-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "micro-optimization",
      source: new URL("./references/micro-optimization.md", import.meta.url),
      target: "references/micro-optimization.md",
      title: "micro-optimization.md",
      summary: "Reference material for modern-javascript-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for modern-javascript-patterns.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
