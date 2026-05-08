import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { bundleOptimizationSkill } from "../bundle-optimization/index";
import { reactComposableComponentsSkill } from "../react-composable-components/index";
import { reactHooksSkill } from "../react-hooks/index";
import { reactServerComponentsSkill } from "../react-server-components/index";
import { webPerformanceDiagnosisSkill } from "../web-performance-diagnosis/index";

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
      reason: "性能问题需要通过组件拆分、组合边界或 children / slot 模式降低渲染面时联动。",
    },
    {
      get id() {
        return reactHooksSkill.id;
      },
      reason: "瓶颈来自 Hook 依赖、effect 设计、回调稳定性或状态组织时联动。",
    },
    {
      get id() {
        return reactServerComponentsSkill.id;
      },
      reason: "需要把重模块、数据获取或渲染边界迁到 Server Components / Server Actions 时联动。",
    },
    {
      get id() {
        return webPerformanceDiagnosisSkill.id;
      },
      reason: "性能症状需要落到 Core Web Vitals、请求瀑布、hydration 或浏览器主线程诊断时联动。",
    },
    {
      get id() {
        return bundleOptimizationSkill.id;
      },
      reason: "瓶颈来自 bundle 体积、代码分割、懒加载边界或第三方脚本时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先用 React DevTools Profiler、浏览器 Performance 或自定义计时确认热点，没有数据不动 memo。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "区分渲染热点、外部 store 订阅、Context value、derived state、列表规模、懒加载和 bundle 体积问题。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "按 `rules` reference 选择具体重渲染规则，通用性能和 store 订阅模式读取 `advanced`。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "优化后对比 commit time、交互延迟、bundle size 或 Core Web Vitals，避免只凭感觉关闭问题。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Profiler / Performance / bundle 证据和热点组件。",
      "memo、useMemo、useCallback、虚拟化、懒加载、transition、store selector 或 Context value 修复建议。",
      "优化前后指标对比、未优化原因和需要转向 Web 性能或 bundle 专项的风险。",
    ],
  }),
  references: [
    defineReference({
      id: "advanced",
      source: new URL("./references/advanced.md", import.meta.url),
      target: "references/advanced.md",
      title: "React 性能高级模式",
      summary: "React 通用性能、重渲染、store 订阅、Context 稳定性和反例模式。",
      loadWhen: "需要深入处理 React 渲染性能、外部 store 订阅或高级优化场景时读取。",
    }),
    defineReference({
      id: "rules",
      source: new URL("./references/rules/", import.meta.url),
      target: "references/rules",
      title: "React 性能规则索引",
      summary: "memo、derived state、inline component、transition、ref、dependency 等重渲染规则集合。",
      loadWhen: "需要按具体规则修复 React 重渲染或 Hook 性能问题时读取。",
    }),
  ],
});
