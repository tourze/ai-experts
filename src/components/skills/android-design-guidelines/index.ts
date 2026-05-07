import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const androidDesignGuidelinesSkill = defineSkill({
  id: "android-design-guidelines",
  fullName: "Android 平台设计规范 — Material Design 3",
  description: "当用户要构建或评审 Android UI、应用 Material Design 3 规范、动态颜色、Compose 组件或自适应布局时使用。",
  useCases: [
    "构建或评审 Android UI 代码（Jetpack Compose / XML）",
    "实现 Material You / 动态颜色",
    "设计导航、布局或组件架构",
    "审计无障碍或平台合规性",
  ],
  constraints: [
    "Android 12+ 默认支持动态颜色，并为 Android 12 以下提供静态回退配色。",
    "组件内禁止硬编码颜色 hex；必须使用 Material 3 color role 和对应 `on*` 前景色。",
    "手机、折叠屏和平板分别按 Window Size Class 选择 Navigation Bar、Rail 或 Drawer。",
    "布局必须支持 Light / Dark、Dynamic Type / 字体缩放、edge-to-edge 和系统手势区域。",
    "权限、通知、Widget、App Links 和无障碍规则按需读取 `rules-4-to-10`，不要凭印象套通用 UI 规则。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "硬编码颜色",
      pass: "引用 color role",
    }),
    defineAntiPattern({
      fail: "底部导航 → 平板",
      pass: "WindowSizeClass 适配",
    }),
    defineAntiPattern({
      fail: "启动批量请求权限",
      pass: "按功能延迟请求",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认目标 Android 版本、屏幕形态、主要导航目的地、Compose / XML 技术栈和是否涉及权限、通知或系统集成。",
      "检查主题：动态颜色、静态回退、Light / Dark、语义 color role 和品牌定制色来源；规则读取 `rules-1-to-3`。",
      "检查导航：Compact、Medium、Expanded 使用合适的 Navigation Bar、Rail 或 Drawer，并支持预测性返回。",
      "检查布局：Window Size Class、网格边距、最大内容宽度、edge-to-edge、WindowInsets 和折叠屏铰链避让。",
      "检查排版、组件、无障碍、手势、通知、权限和系统集成时读取 `rules-4-to-10`。",
      "输出设计修复建议时同时给出设备矩阵和复测路径，不只给视觉偏好判断。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "Material 3 主题、颜色角色、Light / Dark 和动态颜色审计结论。",
      "导航、Window Size Class、edge-to-edge 和折叠屏适配建议。",
      "组件、排版、无障碍、手势、通知、权限和系统集成风险点。",
      "需要验证的设备矩阵、截图 / UI 测试路径和剩余设计风险。",
    ],
  }),
  references: [
    defineReference({
      id: "rules-1-to-3",
      source: new URL("./references/rules-1-to-3.md", import.meta.url),
      target: "references/rules-1-to-3.md",
      title: "Android Material Design 3 第 1-3 条规范",
      summary: "Material You 动态颜色、导航模式、Window Size Class、网格、edge-to-edge 和折叠屏规则。",
      loadWhen: "需要深入审计 Android 主题、导航或响应式布局合规性时读取。",
    }),
    defineReference({
      id: "rules-4-to-10",
      source: new URL("./references/rules-4-to-10.md", import.meta.url),
      target: "references/rules-4-to-10.md",
      title: "rules-4-to-10.md",
      summary: "Android Material Design 3 第 4-10 条设计规范详解。",
      loadWhen: "需要深入理解 Material You 设计规则或审计界面合规性时读取。",
    }),
  ],
});
