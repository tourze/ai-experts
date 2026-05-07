import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { iosHigDesignSkill } from "../ios-hig-design/index";
import { swiftuiUiPatternsSkill } from "../swiftui-ui-patterns/index";

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
  ],
  relatedSkills: [
    {
      get id() {
        return iosHigDesignSkill.id;
      },
      reason: "需要确认整体 iOS 界面层级、平台规范或旧系统回退体验时联动。",
    },
    {
      get id() {
        return swiftuiUiPatternsSkill.id;
      },
      reason: "需要把 Liquid Glass 落到 SwiftUI 组件结构、状态和布局实现时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "不做版本判断",
      pass: "availability 兜底：更多反模式见 [references/advanced-patterns.md](references/advanced-patterns.md)。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认部署目标、API 可用性和旧系统回退；不做版本判断时不得直接使用 Liquid Glass API。",
      "多个玻璃元素放入 `GlassEffectContainer` 并通过 spacing 验证融合效果；玻璃只用于强调层级，不铺满整页。",
      "`interactive()` 只给真实可交互控件；纯装饰层不得伪装成交互层。",
      "Widget 同时检查 full color 和 accented 模式；复杂变形、性能和版本兼容读取 advanced-patterns reference。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "目标系统、availability 判断、回退策略和 Liquid Glass API 使用边界。",
      "玻璃元素层级、GlassEffectContainer 结构、interactive 使用点和 Widget 渲染模式检查结果。",
      "SwiftUI 实现建议、性能风险、视觉层级风险和需要读取 advanced patterns 的复杂场景。",
    ],
  }),
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Liquid Glass 设计的高级模式、版本兼容性处理和性能优化策略。",
      loadWhen: "需要实现复杂的玻璃材质效果、变形过渡或多元素融合场景时读取。",
    }),
  ],
});
