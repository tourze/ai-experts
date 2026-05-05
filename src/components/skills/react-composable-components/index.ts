import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const reactComposableComponentsSkill = defineSkill({
  id: "react-composable-components",
  fullName: "React 可组合组件",
  description: "当用户需要拆分臃肿 React 组件、设计 compound components 或规范 props 透传时使用。",
  useCases: [
    "单个组件已经承担过多布局、状态和渲染分支，读写成本很高。",
    "需要把业务页面抽成设计系统组件，且保留插槽、样式扩展和 `ref` 能力。",
    "同一组件开始出现成串布尔 props，如 `hasHeader`、`showFooter`、`compact`、`withActions`。",
    "如果问题的根因是\"外部状态订阅导致整棵树频繁重渲染\"，优先看 [react-performance](../react-performance/SKILL.md)。",
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
