import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";
import { reactComposableComponentsSkill } from "../react-composable-components/index";
import { reactHooksSkill } from "../react-hooks/index";
import { reactServerComponentsSkill } from "../react-server-components/index";

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
  constraints: [
    "先测量再优化：没 flamegraph / Profiler 数据不动 memo。",
    "memo 生效的前提是 props 引用稳定；父组件每次造新对象就等于没有 memo。",
    "useMemo 只用在昂贵计算或需稳定引用；原始类型表达式不要包。",
    "大列表优先虚拟化；懒加载放在路由和大功能块边界。",
    "不要在 render 内 mutate 数组（先复制再排序）。",
    "derived state 在渲染期直接计算，不要 useEffect + setState 触发二次渲染。",
    "不要在组件内部定义子组件（每次 render 都是新类型，子树会重新挂载）。",
    "外部 store：默认订阅最小 slice，订阅点尽量下沉到叶子；selector 必须稳定，否则永远 ≠。",
    "Context Provider 的 value 必须稳定（用 useMemo），高频更新不适合 Context。",
  ],
  checklist: [
    "先用 Profiler / Performance / 自定义计时确认了热点？",
    "传给 memoized child 的对象、数组、回调引用稳定？",
    "derived state 走渲染期直算而不是 useEffect？",
    "没在组件内定义子组件？",
    "大列表已虚拟化、重模块已懒加载？",
    "外部 store 订阅最小 slice、selector 稳定、必要时 shallowEqual？",
    "Context value 已 useMemo 稳定？",
    "优化前后有可对比数据（commit time / latency / bundle size）？",
  ],
  relatedSkills: [
    {
      get id() {
        return reactComposableComponentsSkill.id;
      },
      reason: "组件拆分：`react-composable-components`。",
    },
    {
      get id() {
        return reactHooksSkill.id;
      },
      reason: "Hook 设计：`react-hooks`。",
    },
    {
      get id() {
        return reactServerComponentsSkill.id;
      },
      reason: "Server 组件：`react-server-components`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
