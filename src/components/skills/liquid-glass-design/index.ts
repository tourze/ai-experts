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
  constraints: [
    "仅在目标系统支持 Liquid Glass API 时使用；旧系统必须保留材质回退方案。",
    "多个玻璃元素优先放进 `GlassEffectContainer`，否则融合与性能都不稳定。",
    "`interactive()` 只给真正可交互的元素，不要让纯装饰层伪装成交互层。",
    "玻璃是强调层次的材料，不是把整页 UI 全部磨成同一块雾面板。",
  ],
  checklist: [
    "确认部署目标与回退策略，不要让旧系统直接编译失败。",
    "多个玻璃元素是否已经放入统一容器，并验证间距带来的融合效果。",
    "是否只在重要交互位使用 `interactive()`，而不是整页都带动态反馈。",
    "Widget 是否同时检查 full color 与 accented 模式。",
    "交叉引用：整体 iOS 界面规范看 `ios-hig-design`；SwiftUI 结构化实现看 `swiftui-ui-patterns`。",
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
