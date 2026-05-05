import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
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
    "如果重点是 JS 线程性能（掉帧、列表卡顿），优先看 `react-native-js-performance`。",
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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "navigation-patterns",
      source: new URL("./references/navigation-patterns.md", import.meta.url),
      target: "references/navigation-patterns.md",
      title: "navigation-patterns.md",
      summary: "Reference material for react-native-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "reanimated-patterns",
      source: new URL("./references/reanimated-patterns.md", import.meta.url),
      target: "references/reanimated-patterns.md",
      title: "reanimated-patterns.md",
      summary: "Reference material for react-native-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "styling-patterns",
      source: new URL("./references/styling-patterns.md", import.meta.url),
      target: "references/styling-patterns.md",
      title: "styling-patterns.md",
      summary: "Reference material for react-native-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
