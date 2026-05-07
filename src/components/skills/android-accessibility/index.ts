import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const androidAccessibilitySkill = defineSkill({
  id: "android-accessibility",
  fullName: "Android 无障碍审计",
  description: "审计或修复 Android Compose / View 无障碍问题。用于 TalkBack 播报、contentDescription、48dp 触摸目标、WCAG 对比度、焦点顺序、键盘 / Switch Access、自定义控件语义或 Canvas 可达性问题。",
  useCases: [
    "用户要求 Android accessibility / a11y / TalkBack 审计或修复。",
    "Compose / View 中标签、语义分组、状态暴露、触摸目标、对比度或焦点顺序存在问题。",
    "需要验证键盘、Switch Access、字体缩放、高对比模式或自定义 Canvas 控件可达性。",
  ],
  constraints: [
    "`Image`、`Icon` 必须提供有意义的 `contentDescription`；纯装饰图片设为 `null`，可点击元素描述动作而不是外观。",
    "所有可交互元素最小触摸区域为 48x48dp；视觉图标小于 48dp 时用 padding 或 `sizeIn` 扩大可点击区域。",
    "色彩对比度至少满足 WCAG AA：普通文本 4.5:1，大文本和图标 3.0:1；禁止只靠颜色传递状态。",
    "相关元素要合并为清晰的语义单元，自定义控件必须暴露状态，手势 / 长按操作必须有 `customActions` 替代路径。",
    "焦点顺序遵循从上到下、Start 到 End；标题暴露 heading，页面切换或 Dialog 关闭后焦点回到逻辑目标。",
    "Canvas 绘制的交互区对 TalkBack 不可见；View 体系用 `ExploreByTouchHelper`，Compose 用语义节点叠加。",
    "需要 Compose / View 代码模式时读取 `advanced-patterns` reference，不把大段代码样例塞进核心约束。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "描述外观",
      pass: "描述动作",
    }),
    defineAntiPattern({
      fail: "缩小按钮节省空间",
      pass: "视觉小但触摸区大：更多反模式见 [references/advanced-patterns.md](references/advanced-patterns.md)。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "逐屏用 TalkBack 扫描核心任务路径，记录缺失、冗余或顺序错误的播报。",
      "用 Layout Inspector 或 UI 层级确认交互元素的语义、状态、分组和最小触摸区域。",
      "用 Accessibility Scanner 自动检测触摸目标、标签、对比度和可聚焦性问题。",
      "用外接键盘或 Switch Access 跑一遍 Tab / 方向键路径，确认所有功能都有非触摸操作方式。",
      "在 200% 字体、粗体文本和高对比度模式下复测关键页面，确认文案不裁切、状态仍可识别。",
      "遇到自定义控件、Canvas 或复杂状态时读取 `advanced-patterns` reference，再给出具体修复方案。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "按页面列出的无障碍缺陷、影响用户和复现路径。",
      "Compose / View 层面的修复点，包括语义、状态、触摸区域、对比度和焦点顺序。",
      "TalkBack、键盘 / Switch Access、字体缩放和高对比度复测结果。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Android 无障碍高级模式：语义分组、自定义操作与 Canvas 视图适配。",
      loadWhen: "需要处理自定义控件无障碍状态暴露或 Canvas 不可见问题时读取。",
    }),
  ],
});
