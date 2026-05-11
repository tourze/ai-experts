import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { reactPerformanceSkill } from "../react-performance/index";
import { reactServerComponentsSkill } from "../react-server-components/index";
import { typescriptTypeSafetySkill } from "../typescript-type-safety/index";

export const reactHooksSkill = defineSkill({
  id: "react-hooks",
  fullName: "React Hooks",
  description: "当用户需要设计自定义 Hook、修复依赖数组、处理 effect 清理或优化状态建模时使用。",
  useCases: [
    "需要在 `useState`、`useReducer`、`useRef`、`useEffect` 之间做职责划分。",
    "要设计可复用的自定义 Hook，并稳定暴露返回值与错误语义。",
    "遇到 effect 重复执行、闭包拿到旧值、依赖数组写不对、清理逻辑遗漏等问题。",
    "如果问题已经扩展成\"渲染性能、外部 store 订阅或 memo 治理\"，统一看 `react-performance`。",
    "类型体操很重时，联动 `typescript-type-safety`。",
  ],
  constraints: [
    "Hook 只能在 React 组件或自定义 Hook 顶层调用，不能放进条件、循环、普通函数。",
    "`useEffect` 只用于“与 React 外部系统同步”；纯计算、派生值、事件驱动动作不要塞进 effect。",
    "依赖数组必须表达真实读集；不要靠注释压 `exhaustive-deps` 规则来“修”闭包问题。",
    "需要跨渲染持有可变值时用 `useRef`；需要触发渲染时才用 state。",
    "复杂状态机优先 `useReducer`，不要让多个 `useState` 形成隐式事务。",
    "自定义 Hook 要处理 SSR、异常输入和清理路径，避免把环境假设硬编码到浏览器端。",
  ],
  checklist: [
    "Hook 是否只在组件或自定义 Hook 顶层调用？",
    "effect 的职责是否确实是“同步外部系统”，而不是做纯派生？",
    "依赖数组是否完整表达了 effect / memo / callback 读取的值？",
    "需要清理的订阅、定时器、事件监听是否都在返回函数中释放？",
    "自定义 Hook 是否处理了 SSR、JSON 解析失败、未挂载组件更新等边界？",
    "返回值 API 是否稳定、语义清晰，并且易于测试？",
  ],
  relatedSkills: [
    {
      get skill() {
        return reactServerComponentsSkill;
      },
      reason: "如果任务在 Next.js App Router / RSC 边界上，优先联动 `react-server-components`。",
    },
    {
      get skill() {
        return reactPerformanceSkill;
      },
      reason: "如果问题已经扩展成\\\"渲染性能、外部 store 订阅或 memo 治理\\\"，统一看 `react-performance`。",
    },
    {
      get skill() {
        return typescriptTypeSafetySkill;
      },
      reason: "自定义 Hook 返回类型、Reducer action 或泛型约束复杂时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "用 effect 复制派生 state",
      pass: "直接计算派生值",
    }),
    defineAntiPattern({
      fail: "删依赖压 ESLint",
      pass: "依赖数组表达真实读集",
    }),
    defineAntiPattern({
      fail: "条件或普通函数里调用 Hook",
      pass: "只在组件或自定义 Hook 顶层调用",
    }),
    defineAntiPattern({
      fail: "默认到处加 useMemo/useCallback",
      pass: "先证明渲染瓶颈再 memo",
    }),
    defineAntiPattern({
      fail: "Hook 直接访问 window/localStorage",
      pass: "隔离 SSR 边界并延后到 effect",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先判断逻辑属于 state、reducer、ref、effect、memo 还是自定义 Hook，避免把纯派生塞进 effect。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "`useEffect` 只同步 React 外部系统，依赖数组必须表达真实读集，清理函数释放订阅、定时器和事件监听。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "复杂状态机优先 `useReducer`，跨渲染可变值用 `useRef`，需要触发渲染才用 state。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "useReducer + useEffect 示例读取 `hooks-code-patterns`；自定义 Hook 和 useMemo 派生值读取 `advanced-patterns`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Hook 职责划分、状态建模、effect 依赖和清理策略。",
      "自定义 Hook API、SSR 边界、异常输入和测试建议。",
      "性能 memo、RSC 边界或类型复杂度的联动风险。",
    ],
  }),
  references: [
    defineReference({
      id: "hooks-code-patterns",
      source: new URL("./references/hooks-code-patterns.md", import.meta.url),
      target: "references/hooks-code-patterns.md",
      title: "React Hooks 代码模式",
      summary: "useReducer 状态机、useState 和 useEffect 清理逻辑示例。",
      loadWhen: "需要快速设计 React Hook 状态和 effect 结构时读取。",
    }),
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "React Hooks 高级模式，包括自定义 Hook 设计、复杂 useReducer 状态机、Effect 清理和闭包处理。",
      loadWhen: "需要查阅自定义 Hook 设计或复杂 Effect 处理等高级模式时读取。",
    }),
    defineReference({
      id: "hooks-cheatsheet",
      source: new URL("./references/hooks-cheatsheet.md", import.meta.url),
      target: "references/hooks-cheatsheet.md",
      title: "React Hooks Quick Reference",
      summary: "React state、effect、ref、memo、依赖数组和自定义 Hook 模板速查。",
      loadWhen: "需要快速回忆 Hooks API、规则或依赖数组语义时读取。",
    }),
  ],
});
