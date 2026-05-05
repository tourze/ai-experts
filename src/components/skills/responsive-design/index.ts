import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";
import { modernWebDesignSkill } from "../modern-web-design/index";
import { webPerformanceDiagnosisSkill } from "../web-performance-diagnosis/index";

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
  constraints: [
    "采用移动优先；基础样式先服务窄屏，再逐级增强。",
    "断点跟内容走，不跟设备型号走。",
    "组件级响应优先使用 `container queries`，页面级结构再用 `media queries`。",
    "响应式不只是宽度变化，还包括触控、键盘、密度、方向和内容长度。",
    "任何断点策略都不能牺牲可访问性和关键操作路径。",
  ],
  checklist: [
    "基础窄屏样式已可用，再逐步增强到大屏。",
    "组件级布局优先用了容器查询或等价机制。",
    "标题、正文、按钮和表单在各断点下都可读可点。",
    "图片、媒体和表格不会在小屏溢出。",
    "断点改动没有破坏键盘导航和焦点可见性。",
  ],
  relatedSkills: [
    {
      get id() {
        return webPerformanceDiagnosisSkill.id;
      },
      reason: "`web-performance-diagnosis`。",
    },
    {
      get id() {
        return modernWebDesignSkill.id;
      },
      label: "web-design-guidelines",
      reason: "`web-design-guidelines`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "桌面优先 + JS 读宽度",
      pass: "移动优先 + CSS 容器查询：断点过多且跟具体设备型号绑定。 小屏上继续保留桌面级内容密度和列数。 因为”适配”而隐藏关键功能或关键信息。",
    }),
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
