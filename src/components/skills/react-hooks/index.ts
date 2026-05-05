import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const reactHooksSkill = defineSkill({
  id: "react-hooks",
  fullName: "React Hooks",
  description: "当用户需要设计自定义 Hook、修复依赖数组、处理 effect 清理或优化状态建模时使用。",
  useCases: [
    "需要在 `useState`、`useReducer`、`useRef`、`useEffect` 之间做职责划分。",
    "要设计可复用的自定义 Hook，并稳定暴露返回值与错误语义。",
    "遇到 effect 重复执行、闭包拿到旧值、依赖数组写不对、清理逻辑遗漏等问题。",
    "如果问题已经扩展成\"渲染性能、外部 store 订阅或 memo 治理\"，统一看 [react-performance](../react-performance/SKILL.md)。",
    "如果任务在 Next.js App Router / RSC 边界上，优先联动 [react-server-components](../react-server-components/SKILL.md)。",
    "类型体操很重时，联动 `typescript-magician`。",
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
      summary: "Reference material for react-hooks.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
