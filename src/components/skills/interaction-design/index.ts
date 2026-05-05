import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const interactionDesignSkill = defineSkill({
  id: "interaction-design",
  description: "当用户需要设计微交互、动效、过渡或反馈状态时使用。适合”加点交互感””做 loading/skeleton””优化 hover/focus/transition””让界面更顺滑”等场景。",
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
    defineReference({
      id: "evals",
      source: new URL("./evals/", import.meta.url),
      target: "references/evals",
      title: "Eval Cases",
      summary: "Eval cases for interaction-design.",
      loadWhen: "Read only when validating or improving this skill.",
    })
  ],
});
