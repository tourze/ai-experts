import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
} from "../../sdk";

export const androidAccessibilitySkill = defineSkill({
  id: "android-accessibility",
  fullName: "Android 无障碍审计",
  description: "当用户要审计或修复 Android 无障碍、TalkBack、触摸目标、对比度或焦点管理时使用。",
  useCases: [
    "审计或修复 Compose / View 的无障碍问题",
    "TalkBack 播报不正确、缺失或冗余",
    "触摸目标过小导致误触",
    "色彩对比度不达标",
    "键盘 / Switch Access 无法操作",
  ],
  constraints: [
    "**1. 内容描述（contentDescription）**\n* `Image`、`Icon` 必须提供有意义的 `contentDescription`\n* 纯装饰性图片设置 `contentDescription = null`\n* 可点击元素描述**动作**（\"播放音乐\"），不描述图标外观（\"三角形\"）\n\n```kotlin\n// ✅ 描述动作\nIconButton(onClick = { playMusic() }) {\nIcon(Icons.Default.PlayArrow, contentDescription = \"播放音乐\")\n}\n\n// ✅ 纯装饰\nImage(painter, contentDescription = null)\n\n// ❌ 描述外观\nIcon(Icons.Default.PlayArrow, contentDescription = \"三角形图标\")\n```",
    "**2. 触摸目标尺寸**\n* 所有可交互元素最小 **48×48dp**，无例外\n* 视觉图标小于 48dp 时，通过 padding 或 `sizeIn` 扩大触摸区域\n* `IconButton` 默认保证 48dp，自定义组件需手动保证\n\n```kotlin\n// 自定义小图标组件 — 触摸区域扩大到 48dp\nBox(\nmodifier = Modifier\n.sizeIn(minWidth = 48.dp, minHeight = 48.dp)\n.clickable { onFavorite() },\ncontentAlignment = Alignment.Center\n) {\nIcon(Icons.Default.Star, contentDescription = \"收藏\", modifier = Modifier.size(16.dp))\n}\n```",
    "**3. 色彩对比度**\n* WCAG AA：普通文本 ≥ **4.5:1**，大文本（≥18sp 或 14sp bold）/ 图标 ≥ **3.0:1**\n* **禁止**仅靠颜色传递信息 — 必须辅以文字、图标或形状\n* 支持系统级粗体文本和高对比度设置\n\n```kotlin\n// 检测系统高对比度文本模式\nval context = LocalContext.current\nval accessibilityManager = context.getSystemService<AccessibilityManager>()\nval isHighTextContrast = accessibilityManager?.isHighTextContrastEnabled ?: false\n\n// 检测系统字体缩放（200% 以上需特别关注布局裁切）\nval fontScale = LocalDensity.current.fontScale\n```",
    "**4. 语义分组与状态**\n* 相关元素用 `Modifier.semantics(mergeDescendants = true)` 合并为单个播报单元\n* 自定义控件通过 `stateDescription` 暴露状态（\"已选中\"、\"已展开\"）\n* 仅通过手势或长按触发的操作，必须同时提供 `customActions` 替代路径\n\n语义分组与状态的完整代码见 [references/advanced-patterns.md](references/advanced-patterns.md)。",
    "**5. 焦点与导航顺序**\n* 焦点顺序：从上到下、Start 到 End\n* 标题用 `Modifier.semantics { heading() }`，支持 TalkBack 按标题跳转\n* 页面切换或 Dialog 关闭后，焦点移至逻辑目标\n* 全部功能可通过 TalkBack、Switch Access、键盘操作\n\n```kotlin\nText(\"设置\", modifier = Modifier.semantics { heading() })\n```",
    "**6. 自定义 Canvas 视图**\nCanvas 绘制的交互区对 TalkBack 完全不可见。View 体系实现 `ExploreByTouchHelper`；Compose 通过 `Modifier.semantics` 叠加语义节点。",
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Reference material for android-accessibility.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
