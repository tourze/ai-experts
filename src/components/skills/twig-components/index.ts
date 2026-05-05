import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";
import { symfonyUxSkill } from "../symfony-ux/index";

export const twigComponentsSkill = defineSkill({
  id: "twig-components",
  fullName: "Twig Components",
  description: "当用户要抽取 Twig 视图片段、实现 TwigComponent、LiveComponent 状态、props、表单联动或模板复用时使用。",
  useCases: [
    "需要在 Symfony 项目中抽取可复用的 TwigComponent 或交互式 LiveComponent。",
    "组件已经重复出现在多个 Twig 模板里，或模板逻辑复杂到难以维护。",
    "想在服务端渲染优先的前提下，为局部界面增加响应式交互。",
    "如果还在决定应该用 Stimulus、Turbo、TwigComponent 还是 LiveComponent，可先看 `symfony-ux`。",
    "更细的组件示例见 [reference.md](reference.md)。",
  ],
  constraints: [
    "先判断组件类型：静态可复用 UI 用 TwigComponent，交互后需要服务端重渲染时再上 LiveComponent。",
    "组件公共属性必须稳定、可命名、可组合，避免把页面级上下文隐式塞进组件内部。",
    "模板只负责展示，不要在 Twig 里堆复杂业务判断或副作用。",
    "LiveComponent 的可写状态必须显式标记为 `LiveProp(writable: true)`，不要靠隐式提交。",
    "组件应该复用现有样式和路由，不要为了抽组件而重造一层平行 UI 体系。",
  ],
  checklist: [
    "组件职责是否单一，且名字能准确表达它提供的 UI 能力。",
    "公共属性、slots、`attributes` 合并策略是否清晰，而不是依赖模板外部魔法变量。",
    "LiveComponent 是否只暴露必要的可写状态，并处理了空值、快速输入和重复请求。",
    "组件模板是否避免直接访问全局状态，改为通过显式 props 或 getter 输入。",
    "相同样式或交互是否已经有现成组件可复用，避免再造近似组件。",
  ],
  relatedSkills: [
    {
      get id() {
        return symfonyUxSkill.id;
      },
      reason: "如果还在决定应该用 Stimulus、Turbo、TwigComponent 还是 LiveComponent，可先看 `symfony-ux`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
