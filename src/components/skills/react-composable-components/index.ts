import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
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
      reason: "如果问题的根因是\\\\\\\"外部状态订阅导致整棵树频繁重渲染\\\\\\\"，优先看 `react-performance`。",
    },
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
      summary: "Reference material for react-composable-components.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
