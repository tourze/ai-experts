import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const responsiveDesignSkill = defineSkill({
  id: "responsive-design",
  fullName: "响应式设计",
  description: "当用户提到响应式布局、适配移动端、流式排版、容器查询、container queries 或移动优先断点时使用。",
  useCases: [
    "页面或组件需要同时适配手机、平板、桌面和大屏。",
    "需要让组件基于容器宽度自适应，而不是绑死视口断点。",
    "需要统一断点、栅格、流式字号和图片策略。",
    "需要排查移动端溢出、断行、内容拥挤或过宽阅读区。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "breakpoint-strategies",
      source: new URL("./references/breakpoint-strategies.md", import.meta.url),
      target: "references/breakpoint-strategies.md",
      title: "breakpoint-strategies.md",
      summary: "Reference material for responsive-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "container-queries",
      source: new URL("./references/container-queries.md", import.meta.url),
      target: "references/container-queries.md",
      title: "container-queries.md",
      summary: "Reference material for responsive-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "fluid-layouts",
      source: new URL("./references/fluid-layouts.md", import.meta.url),
      target: "references/fluid-layouts.md",
      title: "fluid-layouts.md",
      summary: "Reference material for responsive-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
