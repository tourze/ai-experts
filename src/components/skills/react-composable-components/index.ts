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
import { reactPerformanceSkill } from "../react-performance/index";

export const reactComposableComponentsSkill = defineSkill({
  id: "react-composable-components",
  fullName: "React 可组合组件",
  description: "当用户需要拆分臃肿 React 组件、设计 compound components 或规范 props 透传时使用。",
  useCases: [
    "单个组件已经承担过多布局、状态和渲染分支，读写成本很高。",
    "需要把业务页面抽成设计系统组件，且保留插槽、样式扩展和 `ref` 能力。",
    "同一组件开始出现成串布尔 props，如 `hasHeader`、`showFooter`、`compact`、`withActions`。",
    "如果问题的根因是\"外部状态订阅导致整棵树频繁重渲染\"，优先看 `react-performance`。",
  ],
  constraints: [
    "一个组件只做一件事；结构组合优先于“超级配置对象”。",
    "复用型 UI 组件默认接受 `className`、`children`、`...props`，像原生元素一样透明。",
    "包装原生 DOM 元素时，默认补上 `forwardRef`，避免把焦点、测量、滚动能力截断。",
    "共享状态只在局部 compound components 内部用 Context；不要把业务级全局状态塞进组件库内部。",
    "样式覆盖必须可预期；Tailwind 场景下合并类名时要做去重。",
    "避免为了“复用”提炼出过浅抽象；抽象失败时宁可保留两处小重复。",
  ],
  checklist: [
    "是否把大组件拆成了可独立测试、可复用的结构片段？",
    "可复用组件是否支持 `children`、`className` 与原生属性透传？",
    "包装原生元素时是否保留了 `ref`？",
    "样式合并是否会让调用方可靠覆盖默认样式？",
    "需要共享状态时，是否把 Context 作用域控制在局部复合组件内？",
    "是否优先通过组合表达结构，而不是继续叠加布尔 props？",
  ],
  relatedSkills: [
    {
      get id() {
        return reactPerformanceSkill.id;
      },
      reason: "根因是外部状态订阅、memo 边界或整棵树频繁重渲染时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "用配置型 props（`hasHeader`、`headerActions`）替代 `children` 插槽",
      pass: "通过 `children`、slots 或 compound components 表达任意嵌套结构。",
    }),
    defineAntiPattern({
      fail: "不透传原生属性",
      pass: "继承原生 props 并透传 `aria-label`、`disabled`、`type` 等能力。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "把臃肿 React 组件拆成透明、可组合、可扩展的 UI 原语和局部 compound components。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先标出组件职责、状态来源、渲染分支、布局边界和复用场景；过浅重复不急着抽象。",
      "优先用 `children`、slots 和 compound components 表达结构，不继续堆布尔 props 或超级配置对象。",
      "复用型组件默认接受 `className`、`children` 和 `...props`，并继承对应原生元素属性类型。",
      "包装 DOM 元素默认用 `forwardRef`，保留焦点、测量、滚动和表单能力。",
      "样式合并要让调用方可预期覆盖默认样式；Tailwind 场景用 `clsx` + `tailwind-merge`。",
      "共享状态只放在局部 compound components 的 Context 内，业务级全局状态不要塞进组件库。",
      "需要 compound、render props、插槽或 Context 细节时读取 advanced-patterns。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "组件拆分方案：职责、子组件、slots/children、props 透传、ref 保留和状态归属。",
      "实现约束：原生属性类型、className 合并、Tailwind 去重、Context 作用域和测试点。",
      "反抽象判断：哪些重复保留、哪些布尔 props 改为组合、何时转 react-performance。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "React 可组合组件高级模式，包括 compound components、render props、插槽设计和 Context 作用域控制。",
      loadWhen: "需要查阅 compound components、插槽设计或 Context 作用域控制等高级模式时读取。",
    }),
  ],
});
