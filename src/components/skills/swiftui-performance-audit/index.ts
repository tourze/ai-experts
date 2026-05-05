import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const swiftuiPerformanceAuditSkill = defineSkill({
  id: "swiftui-performance-audit",
  fullName: "SwiftUI 性能审计",
  description: "当 SwiftUI 界面出现卡顿、掉帧、高 CPU 或重渲染问题时使用。",
  useCases: [
    "用户反馈列表滚动卡顿、动画掉帧、界面重绘过多、CPU / 内存异常。",
    "需要从代码审查切到 Instruments 指导，再回到具体修复方案。",
    "需要判断是身份不稳定、状态扇出、重计算还是布局链过深导致的性能问题。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "demystify-swiftui-performance-wwdc23",
      source: new URL("./references/demystify-swiftui-performance-wwdc23.md", import.meta.url),
      target: "references/demystify-swiftui-performance-wwdc23.md",
      title: "demystify-swiftui-performance-wwdc23.md",
      summary: "Reference material for swiftui-performance-audit.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "optimizing-swiftui-performance-instruments",
      source: new URL("./references/optimizing-swiftui-performance-instruments.md", import.meta.url),
      target: "references/optimizing-swiftui-performance-instruments.md",
      title: "optimizing-swiftui-performance-instruments.md",
      summary: "Reference material for swiftui-performance-audit.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "understanding-hangs-in-your-app",
      source: new URL("./references/understanding-hangs-in-your-app.md", import.meta.url),
      target: "references/understanding-hangs-in-your-app.md",
      title: "understanding-hangs-in-your-app.md",
      summary: "Reference material for swiftui-performance-audit.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "understanding-improving-swiftui-performance",
      source: new URL("./references/understanding-improving-swiftui-performance.md", import.meta.url),
      target: "references/understanding-improving-swiftui-performance.md",
      title: "understanding-improving-swiftui-performance.md",
      summary: "Reference material for swiftui-performance-audit.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
