import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const twigComponentsSkill = defineSkill({
  id: "twig-components",
  fullName: "Twig Components",
  description: "当用户要抽取 Twig 视图片段、实现 TwigComponent、LiveComponent 状态、props、表单联动或模板复用时使用。",
  useCases: [
    "需要在 Symfony 项目中抽取可复用的 TwigComponent 或交互式 LiveComponent。",
    "组件已经重复出现在多个 Twig 模板里，或模板逻辑复杂到难以维护。",
    "想在服务端渲染优先的前提下，为局部界面增加响应式交互。",
    "如果还在决定应该用 Stimulus、Turbo、TwigComponent 还是 LiveComponent，可先看 [symfony-ux](../symfony-ux/SKILL.md)。",
    "更细的组件示例见 [reference.md](reference.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
