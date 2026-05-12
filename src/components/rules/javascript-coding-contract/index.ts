import { defineRule, defineRuleBody, Platform } from "../../sdk";

export const javascriptCodingContractRule = defineRule({
  id: "javascript-coding-contract",
  title: "JavaScript Coding Contract",
  description: "读写 JavaScript 源码、Jest/Vitest 测试或 JS 模块配置时使用。",
  platforms: [Platform.Claude, Platform.Codex],
  body: defineRuleBody({
    lines: [
      "- 优先使用 `const` / `let`、解构、可选链、空值合并和 `async` / `await` 消除隐式状态；用 `??` 兜底 null/undefined，不用 `||` 误伤 `0`、空字符串或 `false`。",
      "- 数据转换默认保持不可变；有副作用时用显式循环表达，不在 `map` / `filter` 中偷偷修改外部状态。",
      "- Promise 并发只用于互不依赖的任务；依赖步骤串行 `await`，超过一层 Promise 链时改成命名函数和 `async` / `await`。",
      "- 模块只导出稳定 API，不暴露临时 helper、共享可变状态或中间实现；CommonJS / ESM 边界混用必须说明兼容策略。",
      "- 微优化必须先有 profiler 或可复现热点证据；DOM 操作先读后写并批处理，不为局部技巧牺牲可读性。",
      "- Jest/Vitest 异步测试必须显式 `await`、`return`、`resolves` 或 `rejects`；共享状态在 `beforeEach` / `afterEach` 收敛，mock 只隔离外部边界。",
      "- 组件测试按可访问性语义查询元素，快照只用于稳定结构且变化时解释行为仍正确。",
    ],
  }),
  paths: [
    "**/*.js",
    "**/*.jsx",
    "**/*.mjs",
    "**/*.cjs",
    "package.json",
    "jest.config.js",
    "jest.config.mjs",
    "vitest.config.js",
    "vitest.config.mjs",
    "eslint.config.js",
    "eslint.config.mjs",
  ],
  priority: 30,
});
