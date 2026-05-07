import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { modernWebDesignSkill } from "../modern-web-design/index";

export const interactionDesignSkill = defineSkill({
  id: "interaction-design",
  fullName: "交互设计",
  description: "当用户需要设计微交互、动效、过渡或反馈状态时使用。适合”加点交互感””做 loading/skeleton””优化 hover/focus/transition””让界面更顺滑”等场景。",
  useCases: [
    "为按钮、卡片、表单、导航和反馈提示增加微交互。",
    "设计页面切换、弹层展开、列表刷新等状态过渡。",
    "为加载、提交、空态、成功态和失败态设计反馈。",
    "需要把交互与性能、无障碍和品牌风格同时兼顾。",
  ],
  constraints: [
    "动效必须服务信息传达：反馈、导向、层级和连续性，不做纯装饰噪音。",
    "默认优先 CSS 或轻量动画能力；只有需要复杂编排时再引入更重的库。",
    "所有动效都要兼容 `prefers-reduced-motion`。",
    "微交互时长控制在感知区间：100-150ms 反馈、200-300ms 轻过渡、300-500ms 中型切换。",
    "一个页面只需要少量高质量动效，不要处处都在动。",
  ],
  checklist: [
    "每个动效都能解释”它在告诉用户什么”。",
    "hover、focus、active、disabled、loading 状态都完整。",
    "已验证低性能设备和降级动效偏好。",
    "过渡不会阻塞主要操作或影响可读性。",
    "动效速度、位移和透明度变化有一致的系统感。",
    "按钮按压用 `scale(0.96)`，不低于 0.95。",
    "图标动画用 opacity+scale+blur，不直接 toggle visibility。",
  ],
  relatedSkills: [
    {
      get id() {
        return modernWebDesignSkill.id;
      },
      reason: "需要把动效语言和整体视觉风格、层级、布局及现代 Web 质感统一时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "按钮无即时反馈",
      pass: "反馈 + 锁定",
    }),
    defineAntiPattern({
      fail: "到处都在动",
      pass: "只保留说明状态、层级或路径的动效。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "为界面设计有信息含义、可中断、性能克制且兼容 reduced motion 的微交互、过渡和反馈状态。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先说明每个动效告诉用户什么：反馈、导向、层级、连续性或状态变化。",
      "补齐 hover、focus、active、disabled、loading、success 和 error 状态，不用动效掩盖信息架构问题。",
      "按钮按压默认 scale 0.96，不低于 0.95；图标切换用 opacity、scale、blur 或 AnimatePresence 交叉过渡。",
      "控制时长：100-150ms 即时反馈，200-300ms 轻过渡，300-500ms 中型切换。",
      "优先 CSS 或轻量能力；复杂编排才读取 animation-libraries、microinteraction-patterns 或 press-and-icon-patterns。",
      "为 `prefers-reduced-motion` 提供降级，并检查低性能设备、可读性和主要操作是否被阻塞。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "交互状态矩阵：元素、状态、动效目的、时长、easing 和降级方式。",
      "按钮按压、图标切换、入场/退场、loading/skeleton 或页面过渡方案。",
      "性能、无障碍、reduced motion、品牌一致性和需要联动视觉设计的事项。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "animation-libraries",
      source: new URL("./references/animation-libraries.md", import.meta.url),
      target: "references/animation-libraries.md",
      title: "animation-libraries.md",
      summary: "前端动画库选型对比：CSS 动画、GSAP、Framer Motion、AutoAnimate 的适用场景。",
      loadWhen: "需要为微交互选型动画库或评估轻量与重量方案时读取。",
    }),
    defineReference({
      id: "lottie-animations",
      source: new URL("./references/lottie-animations.md", import.meta.url),
      target: "references/lottie-animations.md",
      title: "lottie-animations.md",
      summary: "Lottie 动画集成指南：导出准备、播放控制、性能优化与降级策略。",
      loadWhen: "需要在 Web 或移动端集成 Lottie 复杂动画时读取。",
    }),
    defineReference({
      id: "microinteraction-patterns",
      source: new URL("./references/microinteraction-patterns.md", import.meta.url),
      target: "references/microinteraction-patterns.md",
      title: "microinteraction-patterns.md",
      summary: "微交互模式库：按钮反馈、卡片交互、表单校验与导航切换的动态模式。",
      loadWhen: "需要为常见 UI 元素设计微交互反馈效果时读取。",
    }),
    defineReference({
      id: "press-and-icon-patterns",
      source: new URL("./references/press-and-icon-patterns.md", import.meta.url),
      target: "references/press-and-icon-patterns.md",
      title: "press-and-icon-patterns.md",
      summary: "按钮按压与图标动画模式：scale 反馈、透明度与模糊过渡的技巧。",
      loadWhen: "需要设计按钮按压态或图标动画细节时读取。",
    }),
    defineReference({
      id: "scroll-animations",
      source: new URL("./references/scroll-animations.md", import.meta.url),
      target: "references/scroll-animations.md",
      title: "scroll-animations.md",
      summary: "滚动动画实现模式：视差、渐入、固定定位与滚动驱动动画技术。",
      loadWhen: "需要为页面设计滚动触发的动画效果时读取。",
    }),
  ],
});
