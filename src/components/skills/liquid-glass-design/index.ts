import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const liquidGlassDesignSkill = defineSkill({
  id: "liquid-glass-design",
  fullName: "Liquid Glass 设计",
  description: "当用户要在 iOS 26 做 Liquid Glass、玻璃材质、容器融合、WidgetKit 外观、变形过渡或视觉层级时使用。",
  useCases: [
    "为 iOS 26+ / iPadOS 26+ 界面引入新一代玻璃材质。",
    "需要实现玻璃按钮、工具栏、卡片、浮层或元素之间的变形过渡。",
    "需要让 WidgetKit 在 full color / accented 模式下保持正确视觉层次。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Reference material for liquid-glass-design.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
