import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const symfonyUxSkill = defineSkill({
  id: "symfony-ux",
  fullName: "Symfony UX",
  description: "当用户要在 Symfony 项目中选择 Stimulus、Turbo、UX 套件、前端交互方案、异步片段刷新或组件组合策略时使用。",
  useCases: [
    "需要在 Symfony 项目里判断应该用 Stimulus、Turbo、TwigComponent、LiveComponent、UX Icons 还是 UX Map。",
    "页面已经是服务端渲染，但又需要局部导航、表单交互、实时搜索或第三方 JS 增强。",
    "想把“尽量少写前端框架代码”的思路落到具体组件与页面结构上。",
    "如果已经明确要抽取组件，可直接联动 [twig-components](../twig-components/SKILL.md)；如果页面交互最终要进入异步任务，可联动 [symfony-messenger](../symfony-messenger/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
