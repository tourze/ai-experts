import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { reactPerformanceSkill } from "../react-performance/index";
import { reactServerComponentsSkill } from "../react-server-components/index";

export const reactHooksSkill = defineSkill({
  id: "react-hooks",
  fullName: "React Hooks",
  description: "当用户需要设计自定义 Hook、修复依赖数组、处理 effect 清理或优化状态建模时使用。",
  useCases: [
    "需要在 `useState`、`useReducer`、`useRef`、`useEffect` 之间做职责划分。",
    "要设计可复用的自定义 Hook，并稳定暴露返回值与错误语义。",
    "遇到 effect 重复执行、闭包拿到旧值、依赖数组写不对、清理逻辑遗漏等问题。",
    "如果问题已经扩展成\"渲染性能、外部 store 订阅或 memo 治理\"，统一看 `react-performance`。",
    "如果任务在 Next.js App Router / RSC 边界上，优先联动 `react-server-components`。",
    "类型体操很重时，联动 `typescript-magician`。",
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
      get id() {
        return reactServerComponentsSkill.id;
      },
      reason: "如果任务在 Next.js App Router / RSC 边界上，优先联动 `react-server-components`。",
    },
    {
      get id() {
        return reactPerformanceSkill.id;
      },
      reason: "如果问题已经扩展成\\\"渲染性能、外部 store 订阅或 memo 治理\\\"，统一看 `react-performance`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "用 effect 复制派生 state",
      pass: "直接计算派生值",
    }),
    defineAntiPattern({
      fail: "删依赖压 ESLint",
      pass: "依赖数组表达真实读集：条件调用 Hook，或在普通工具函数里偷偷调用 Hook。 默认到处加 `useMemo` / `useCallback`，却没有证明它能改善瓶颈。 自定义 Hook 直接访问 `window`、`document`、`localStorage`，在 SSR 下崩溃。",
    }),
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
      summary: "React Hooks 高级模式，包括自定义 Hook 设计、复杂 useReducer 状态机、Effect 清理和闭包处理。",
      loadWhen: "需要查阅自定义 Hook 设计或复杂 Effect 处理等高级模式时读取。",
    }),
  ],
});
