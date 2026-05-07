import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { javascriptTypescriptJestSkill } from "../javascript-typescript-jest/index";
import { reactHooksSkill } from "../react-hooks/index";
import { typescriptTypeSafetySkill } from "../typescript-type-safety/index";

export const modernJavascriptPatternsSkill = defineSkill({
  id: "modern-javascript-patterns",
  fullName: "现代 JavaScript 模式",
  description: "当需要用现代 ES6+ 特性重构旧代码、编写可维护 JavaScript 或优化 JS 热路径性能时使用。用户提到微优化、Set/Map 查找、循环优化、DOM 批处理、requestIdleCallback 时触发。",
  useCases: [
    "需要把旧式回调、共享可变状态或冗长工具函数重构为现代 ES6+ 写法。",
    "需要在业务代码和测试代码之间复用一致的数据变换模式时，联动 `javascript-typescript-jest`。",
    "涉及复杂状态或 Hook 边界时，优先确认 `react-hooks` 的约束。",
    "需要更完整的函数式、模块化与高级语法补充材料时，再展开 [advanced-patterns.md](references/advanced-patterns.md)。",
    "需要热路径微优化（Set/Map 查找、迭代合并、DOM 批处理、requestIdleCallback）时，展开 [micro-optimization.md](references/micro-optimization.md)。",
    "涉及复杂类型推导、API 合同收敛或 `any` 清理时，转到 `typescript-type-safety`。",
  ],
  constraints: [
    "优先用小而直白的语法升级：`const` / `let`、解构、可选链、空值合并、`async/await`。",
    "数据转换默认保持不可变；只有性能或外部 API 明确要求时才原地修改。",
    "Promise 链最多一层；超过一层时改写为命名函数加 `async/await`。",
    "模块边界只导出稳定 API，不暴露中间辅助函数与临时状态。",
    "只有在团队已有约定或性能证据明确时才引入函数式管道、生成器等高级抽象。",
    "微优化只在热路径上有意义 — 先 Profiler 确认瓶颈，不牺牲可读性，DOM 批处理先读后写。",
  ],
  checklist: [
    "是否消除了回调嵌套、共享可变状态和隐式 `this`。",
    "是否使用 `??` 而不是会误伤 `0` / `\"\"` / `false` 的 `||`。",
    "是否把数组转换写成 `map` / `filter` / `reduce` 等可读流程，而不是副作用循环。",
    "是否对异步边界补上错误语义、超时或重试策略。",
    "是否让导出函数名表达业务意图，而不是暴露 `helper` / `util` / `temp`。",
    "若引入高级语法，团队成员是否无需额外上下文就能读懂。",
  ],
  relatedSkills: [
    {
      get id() {
        return javascriptTypescriptJestSkill.id;
      },
      reason: "需要在业务代码和测试代码之间复用一致的数据变换模式时，联动 `javascript-typescript-jest`。",
    },
    {
      get id() {
        return reactHooksSkill.id;
      },
      reason: "现代 JS 重构触及 React Hook 状态、effect 或闭包依赖边界时联动。",
    },
    {
      get id() {
        return typescriptTypeSafetySkill.id;
      },
      reason: "重构涉及 API 合同、复杂泛型、`any` 清理或 TypeScript 边界时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "用 || 代替 ?? 误伤合法假值",
      pass: "用 ?? 只兜底 null/undefined",
    }),
    defineAntiPattern({
      fail: "map 里偷偷修改外部状态",
      pass: "返回新值或改用显式循环表达副作用",
    }),
    defineAntiPattern({
      fail: "依赖步骤用 Promise.all 并发",
      pass: "只并发互不依赖的异步操作",
    }),
    defineAntiPattern({
      fail: "CommonJS / ESM 边界混用无说明",
      pass: "明确模块导出形态和兼容层",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "用现代 ES6+ 语法重构 JavaScript 回调、共享可变状态、异步流程、数据转换和热路径代码，保持可读性与证据驱动优化。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认目标是语法升级、异步收口、数据变换、模块边界还是热路径优化。",
      "优先使用 `const` / `let`、解构、展开、可选链、空值合并和 `async/await` 消除隐式状态。",
      "数据转换默认不可变，Promise 并发只用于互不依赖步骤；微优化必须先有 profiler 证据。",
      "解构、async/await 和纯函数流水线示例读取 `core-refactor-patterns`；高级抽象和微优化读取对应 references。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "现代 JS 重构点、异步边界、模块 API 和数据转换建议。",
      "可读性、不可变性、错误语义和性能证据结论。",
      "需要补的 Jest 测试、类型边界或微优化验证。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "core-refactor-patterns",
      source: new URL("./references/core-refactor-patterns.md", import.meta.url),
      target: "references/core-refactor-patterns.md",
      title: "现代 JavaScript 核心重构模式",
      summary: "解构与展开、async/await 错误收口和小型纯函数数据流水线示例。",
      loadWhen: "需要快速把旧 JavaScript 代码改成现代可维护写法时读取。",
    }),
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "ES6+ 高级 JavaScript 模式，包括函数式管道、生成器、Proxy、装饰器等进阶写法。",
      loadWhen: "需要引入函数式编程、生成器、Proxy 等高级抽象或重构复杂调用链时读取。",
    }),
    defineReference({
      id: "micro-optimization-rules",
      source: new URL("./references/micro-optimization-rules/", import.meta.url),
      target: "references/micro-optimization-rules",
      title: "micro-optimization-rules",
      summary: "JavaScript 热路径微优化规则的详细说明文档和实现方案目录。",
      loadWhen: "需要查看微优化规则的完整说明目录和具体实现方案时读取。",
    }),
    defineReference({
      id: "micro-optimization",
      source: new URL("./references/micro-optimization.md", import.meta.url),
      target: "references/micro-optimization.md",
      title: "micro-optimization.md",
      summary: "JavaScript 热路径微优化策略，涵盖 Set/Map 查找、迭代合并、DOM 批处理和 requestIdleCallback 等场景。",
      loadWhen: "需要在性能关键路径上做微优化，或确认优化方案不牺牲可读性时读取。",
    }),
  ],
});
