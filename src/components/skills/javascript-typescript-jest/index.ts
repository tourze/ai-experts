import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";
import { modernJavascriptPatternsSkill } from "../modern-javascript-patterns/index";
import { testingPatternsSkill } from "../testing-patterns/index";

export const javascriptTypescriptJestSkill = defineSkill({
  id: "javascript-typescript-jest",
  fullName: "Jest 测试模式",
  description: "当需要用 Jest 为 JavaScript 或 TypeScript 编写单元测试、mock 或异步测试时使用。",
  useCases: [
    "需要为 JavaScript / TypeScript 模块补单元测试或轻量集成测试。",
    "写测试前需要先把生产代码整理为更易测试的现代写法时，先参考 `modern-javascript-patterns`。",
    "组件测试涉及 Hook 行为时，对照 `react-hooks`；涉及复杂类型推断时，对照 `typescript-magician`。",
    "已有 React Testing Library 栈时，沿用项目既有 `render` / `screen` / `userEvent` 封装，不要另起一套 helper。",
  ],
  constraints: [
    "异步测试必须显式 `await`、`return` 或使用 `resolves` / `rejects`；禁止依赖隐式完成。",
    "快照只用于稳定结构；一旦快照变化，需要同步解释为什么行为仍正确。",
    "组件测试默认按可访问性语义查询元素，而不是依赖实现细节 `className`。",
  ],
  checklist: [
    "是否在 `afterEach` / `beforeEach` 清理共享状态。",
    "是否对 Promise 使用 `await expect(...).rejects` 或 `await expect(...).resolves`。",
    "组件测试是否优先 `getByRole`、`getByLabelText`、`findByText` 等面向用户的查询。",
  ],
  relatedSkills: [
    {
      get id() {
        return modernJavascriptPatternsSkill.id;
      },
      reason: "如果测试脆弱到依赖太多 mock，是否应该先回到 `modern-javascript-patterns` 重构生产代码。",
    },
    {
      get id() {
        return testingPatternsSkill.id;
      },
      reason: "通用测试原则（AAA/FIRST/fixture/mock/参数化/反模式）见 `testing-patterns`。本 skill 只覆盖 JavaScript/TypeScript 特有语法与工具。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
