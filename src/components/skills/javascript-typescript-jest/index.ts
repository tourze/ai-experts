import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const javascriptTypescriptJestSkill = defineSkill({
  id: "javascript-typescript-jest",
  fullName: "Jest 测试模式",
  description: "当需要用 Jest 为 JavaScript 或 TypeScript 编写单元测试、mock 或异步测试时使用。",
  useCases: [
    "需要为 JavaScript / TypeScript 模块补单元测试或轻量集成测试。",
    "写测试前需要先把生产代码整理为更易测试的现代写法时，先参考 [modern-javascript-patterns](../modern-javascript-patterns/SKILL.md)。",
    "组件测试涉及 Hook 行为时，对照 `react-hooks`；涉及复杂类型推断时，对照 `typescript-magician`。",
    "已有 React Testing Library 栈时，沿用项目既有 `render` / `screen` / `userEvent` 封装，不要另起一套 helper。",
  ],
  constraints: [
    "异步测试必须显式 `await`、`return` 或使用 `resolves` / `rejects`；禁止依赖隐式完成。",
    "快照只用于稳定结构；一旦快照变化，需要同步解释为什么行为仍正确。",
    "组件测试默认按可访问性语义查询元素，而不是依赖实现细节 `className`。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
