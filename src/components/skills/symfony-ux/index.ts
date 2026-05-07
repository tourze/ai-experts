import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
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
      reason: "页面需要抽取可复用 TwigComponent、slots 或服务端渲染组件时联动。",
    },
    {
      get id() {
        return symfonyMessengerSkill.id;
      },
      reason: "页面交互会触发异步任务、后台处理或失败队列时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "纯展示用 LiveComponent",
      pass: "纯展示用 TwigComponent",
    }),
    defineAntiPattern({
      fail: "Turbo + Stimulus 抢同一块 DOM",
      pass: "单一机制主导",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "在 Symfony 服务端渲染页面中选择 Turbo、Stimulus、TwigComponent、LiveComponent、UX Icons 和 UX Map 的最小交互组合。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认交互是否需要服务端参与、是否只需局部导航、表单增强、实时搜索或第三方 JS。",
      "优先从 Turbo Drive / Frame 思考页面流，纯前端行为用 Stimulus，需要服务端状态参与再用 LiveComponent。",
      "同一块 DOM 只能有一个主导状态机制，避免 Turbo、Stimulus、LiveComponent 抢控制权。",
      "Turbo Frame、Stimulus、LiveComponent 和 UX Icons 示例读取 `ux-component-patterns`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Symfony UX 工具选择、页面边界和状态主导机制。",
      "Turbo / Stimulus / TwigComponent / LiveComponent / Icons 组合建议。",
      "需要补的渐进增强、测试和异步任务衔接风险。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "ux-component-patterns",
      source: new URL("./references/ux-component-patterns.md", import.meta.url),
      target: "references/ux-component-patterns.md",
      title: "Symfony UX 组件模式",
      summary: "Turbo Frame、Stimulus、LiveComponent 和 UX Icons 的 Twig 示例。",
      loadWhen: "需要快速选择或实现 Symfony UX 页面交互模式时读取。",
    }),
  ],
});
