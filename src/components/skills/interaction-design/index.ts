import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
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
  relatedSkills: [
    {
      get id() {
        return modernWebDesignSkill.id;
      },
      reason: "`modern-web-design`。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "animation-libraries",
      source: new URL("./references/animation-libraries.md", import.meta.url),
      target: "references/animation-libraries.md",
      title: "animation-libraries.md",
      summary: "Reference material for interaction-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "lottie-animations",
      source: new URL("./references/lottie-animations.md", import.meta.url),
      target: "references/lottie-animations.md",
      title: "lottie-animations.md",
      summary: "Reference material for interaction-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "microinteraction-patterns",
      source: new URL("./references/microinteraction-patterns.md", import.meta.url),
      target: "references/microinteraction-patterns.md",
      title: "microinteraction-patterns.md",
      summary: "Reference material for interaction-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "press-and-icon-patterns",
      source: new URL("./references/press-and-icon-patterns.md", import.meta.url),
      target: "references/press-and-icon-patterns.md",
      title: "press-and-icon-patterns.md",
      summary: "Reference material for interaction-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "scroll-animations",
      source: new URL("./references/scroll-animations.md", import.meta.url),
      target: "references/scroll-animations.md",
      title: "scroll-animations.md",
      summary: "Reference material for interaction-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
