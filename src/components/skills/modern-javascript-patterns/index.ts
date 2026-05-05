import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const modernJavascriptPatternsSkill = defineSkill({
  id: "modern-javascript-patterns",
  fullName: "现代 JavaScript 模式",
  description: "当需要用现代 ES6+ 特性重构旧代码、编写可维护 JavaScript 或优化 JS 热路径性能时使用。用户提到微优化、Set/Map 查找、循环优化、DOM 批处理、requestIdleCallback 时触发。",
  useCases: [
    "需要把旧式回调、共享可变状态或冗长工具函数重构为现代 ES6+ 写法。",
    "需要在业务代码和测试代码之间复用一致的数据变换模式时，联动 [javascript-typescript-jest](../javascript-typescript-jest/SKILL.md)。",
    "涉及复杂状态或 Hook 边界时，优先确认 `react-hooks` 的约束。",
    "需要更完整的函数式、模块化与高级语法补充材料时，再展开 [advanced-patterns.md](references/advanced-patterns.md)。",
    "需要热路径微优化（Set/Map 查找、迭代合并、DOM 批处理、requestIdleCallback）时，展开 [micro-optimization.md](references/micro-optimization.md)。",
    "涉及复杂类型推导、API 合同收敛或 `any` 清理时，转到 `typescript-magician`。",
  ],
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
  ],
});
