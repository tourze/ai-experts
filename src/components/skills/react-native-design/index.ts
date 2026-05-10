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
import { reactNativeJsPerformanceSkill } from "../react-native-js-performance/index";

export const reactNativeDesignSkill = defineSkill({
  id: "react-native-design",
  fullName: "React Native 设计实现",
  description: "当用户需要实现 RN 样式、导航结构、手势交互、Reanimated 动画、跨端布局或移动端视觉组件时使用。",
  useCases: [
    "需要实现跨 iOS / Android 的 React Native 页面、组件和交互。",
    "需要落地 React Navigation、手势驱动交互、转场动画或复杂布局。",
    "需要处理响应式尺寸、平台差异、触控反馈与动效时序。",
    "详细实施参考（按需读取）：\n- [references/navigation-patterns.md](references/navigation-patterns.md) — React Navigation 类型安全、深度链接、auth 流程\n- [references/reanimated-patterns.md](references/reanimated-patterns.md) — Reanimated 3 手势、动画模式、布局动画\n- [references/styling-patterns.md](references/styling-patterns.md) — StyleSheet、主题系统、响应式布局",
  ],
  constraints: [
    "默认使用 `StyleSheet.create` 固化样式；热路径里避免频繁新建内联样式对象。",
    "导航层级要稳定：路由负责页面切换，组件不要私下维护另一套“伪导航”状态。",
    "高帧率动画优先走 Reanimated worklet；不要把跟手动画压回 JS 线程。",
    "平台分支应尽量收敛在边界组件或样式层，不要把 `Platform.OS` 散落在整页 JSX 里。",
    "触控区、可见状态、加载态必须明确；移动端交互不能只看静态视觉。",
  ],
  checklist: [
    "样式是否主要通过 `StyleSheet.create` 或稳定引用构建？",
    "手势与动画是否放在 Reanimated / Gesture Handler 的正确线程模型上？",
    "页面切换是否通过导航栈管理，而不是手写隐藏/显示分支模拟导航？",
    "不同尺寸、刘海屏、安全区与横竖屏下是否都可用？",
    "平台分支是否集中在边界层，而不是散在业务组件内部？",
    "交互反馈、禁用态、加载态与错误态是否明确可见？",
  ],
  relatedSkills: [
    {
      get id() {
        return reactNativeJsPerformanceSkill.id;
      },
      reason: "如果重点是 JS 线程性能（掉帧、列表卡顿），优先看 `react-native-js-performance`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "render 内构造 style",
      pass: "StyleSheet.create",
    }),
    defineAntiPattern({
      fail: "JS 线程做跟手动画",
      pass: "Reanimated worklet (UI 线程)",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认页面目标、导航层级、视觉状态、平台差异、安全区、触控反馈和动画需求。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "样式和主题实现读取 `styling-patterns` reference；快速代码样例读取 `component-code-patterns`。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "导航结构、深链和 auth flow 读取 `navigation-patterns` reference，避免手写伪导航状态。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "手势和动画读取 `reanimated-patterns` reference，跟手动画放到 Reanimated worklet/UI 线程。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "平台分支集中在边界组件或样式层，避免散落在业务 JSX。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "输出组件结构、样式策略、导航/动画实现、状态覆盖和跨设备验证清单。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "页面/组件目标、状态和平台约束。",
      "StyleSheet/主题/响应式布局方案。",
      "导航、深链、手势和 Reanimated 动画实现方案。",
      "安全区、触控反馈、加载/错误/禁用态和验证矩阵。",
    ],
  }),
  references: [
    defineReference({
      id: "component-code-patterns",
      source: new URL("./references/component-code-patterns.md", import.meta.url),
      target: "references/component-code-patterns.md",
      title: "React Native 组件代码模式",
      summary: "React Native StyleSheet 卡片、Reanimated CTA 和 React Navigation 栈的最小代码示例。",
      loadWhen: "需要快速查看 RN 样式、动画或导航基础代码模式时读取。",
    }),
    defineReference({
      id: "navigation-patterns",
      source: new URL("./references/navigation-patterns.md", import.meta.url),
      target: "references/navigation-patterns.md",
      title: "navigation-patterns.md",
      summary: "React Navigation 类型安全、深度链接和认证流程的配置与模式。",
      loadWhen: "需要设计或排查 React Navigation 导航结构时读取。",
    }),
    defineReference({
      id: "reanimated-patterns",
      source: new URL("./references/reanimated-patterns.md", import.meta.url),
      target: "references/reanimated-patterns.md",
      title: "reanimated-patterns.md",
      summary: "Reanimated 3 手势驱动、动画模式和布局动画的实现指南。",
      loadWhen: "需要实现 Reanimated 手势动画或布局动画时读取。",
    }),
    defineReference({
      id: "styling-patterns",
      source: new URL("./references/styling-patterns.md", import.meta.url),
      target: "references/styling-patterns.md",
      title: "styling-patterns.md",
      summary: "React Native 样式系统、主题结构和响应式布局的实现模式。",
      loadWhen: "需要设计或重构 React Native 样式和主题系统时读取。",
    }),
  ],
});
