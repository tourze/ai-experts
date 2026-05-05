import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";
import { symfonyMessengerSkill } from "../symfony-messenger/index";
import { twigComponentsSkill } from "../twig-components/index";

export const symfonyUxSkill = defineSkill({
  id: "symfony-ux",
  fullName: "Symfony UX",
  description: "当用户要在 Symfony 项目中选择 Stimulus、Turbo、UX 套件、前端交互方案、异步片段刷新或组件组合策略时使用。",
  useCases: [
    "需要在 Symfony 项目里判断应该用 Stimulus、Turbo、TwigComponent、LiveComponent、UX Icons 还是 UX Map。",
    "页面已经是服务端渲染，但又需要局部导航、表单交互、实时搜索或第三方 JS 增强。",
    "想把“尽量少写前端框架代码”的思路落到具体组件与页面结构上。",
    "如果已经明确要抽取组件，可直接联动 `twig-components`；如果页面交互最终要进入异步任务，可联动 `symfony-messenger`。",
  ],
  constraints: [
    "渐进增强优先：先保证 HTML 和服务端渲染可用，再叠加交互能力。",
    "选最简单的工具：Turbo 能解决的不要先上 Stimulus，TwigComponent 能解决的不要直接上 LiveComponent。",
    "LiveComponent 只用于确实需要服务端参与的交互；纯前端状态切换优先 Stimulus。",
    "一个页面可以组合多种 UX 工具，但边界必须清楚，避免 Turbo、Stimulus 和 LiveComponent 同时争抢同一块 DOM。",
    "图标和地图属于辅助能力，不要让它们主导页面架构。",
  ],
  checklist: [
    "当前交互是否真的需要服务端参与，还是前端行为就够了。",
    "页面是否先从 Turbo Drive / Frame 方案思考，再决定是否追加 Stimulus。",
    "同一块 UI 是否只有一个主导机制，避免多套状态源同时控制。",
    "图标、地图、实时搜索等增强能力是否保持在页面边界内，没有侵入业务核心流程。",
  ],
  relatedSkills: [
    {
      get id() {
        return twigComponentsSkill.id;
      },
      reason: "如果已经明确要抽取组件，可直接联动 `twig-components`；如果页面交互最终要进入异步任务，可联动 `symfony-messenger`。",
    },
    {
      get id() {
        return symfonyMessengerSkill.id;
      },
      reason: "如果已经明确要抽取组件，可直接联动 `twig-components`；如果页面交互最终要进入异步任务，可联动 `symfony-messenger`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
