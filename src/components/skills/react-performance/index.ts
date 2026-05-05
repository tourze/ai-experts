import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const reactPerformanceSkill = defineSkill({
  id: "react-performance",
  fullName: "React 性能优化",
  description: "当用户要分析或优化 React 渲染性能、不必要重渲染或外部 store 订阅问题时使用。",
  useCases: [
    "页面、组件树或交互卡顿，需要确认热点。",
    "决定是否上 memo / useMemo / useCallback / 虚拟列表 / 懒加载。",
    "组件因外部 store（XState / Redux / Zustand / Nanostores / Context）订阅导致整片重渲染。",
    "需要把 derived state 从 useEffect 迁回渲染期，或用 startTransition / useDeferredValue 处理非紧急更新。",
    "用 React DevTools Profiler、浏览器 Performance、bundle 分析工具找瓶颈。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
