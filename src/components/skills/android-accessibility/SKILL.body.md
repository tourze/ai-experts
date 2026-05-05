## 适用场景

* 审计或修复 Compose / View 的无障碍问题
* TalkBack 播报不正确、缺失或冗余
* 触摸目标过小导致误触
* 色彩对比度不达标
* 键盘 / Switch Access 无法操作

## 核心约束

### 1. 内容描述（contentDescription）

* `Image`、`Icon` 必须提供有意义的 `contentDescription`
* 纯装饰性图片设置 `contentDescription = null`
* 可点击元素描述**动作**（"播放音乐"），不描述图标外观（"三角形"）

```kotlin
// ✅ 描述动作
IconButton(onClick = { playMusic() }) {
    Icon(Icons.Default.PlayArrow, contentDescription = "播放音乐")
}

// ✅ 纯装饰
Image(painter, contentDescription = null)

// ❌ 描述外观
Icon(Icons.Default.PlayArrow, contentDescription = "三角形图标")
```

### 2. 触摸目标尺寸

* 所有可交互元素最小 **48×48dp**，无例外
* 视觉图标小于 48dp 时，通过 padding 或 `sizeIn` 扩大触摸区域
* `IconButton` 默认保证 48dp，自定义组件需手动保证

```kotlin
// 自定义小图标组件 — 触摸区域扩大到 48dp
Box(
    modifier = Modifier
        .sizeIn(minWidth = 48.dp, minHeight = 48.dp)
        .clickable { onFavorite() },
    contentAlignment = Alignment.Center
) {
    Icon(Icons.Default.Star, contentDescription = "收藏", modifier = Modifier.size(16.dp))
}
```

### 3. 色彩对比度

* WCAG AA：普通文本 ≥ **4.5:1**，大文本（≥18sp 或 14sp bold）/ 图标 ≥ **3.0:1**
* **禁止**仅靠颜色传递信息 — 必须辅以文字、图标或形状
* 支持系统级粗体文本和高对比度设置

```kotlin
// 检测系统高对比度文本模式
val context = LocalContext.current
val accessibilityManager = context.getSystemService<AccessibilityManager>()
val isHighTextContrast = accessibilityManager?.isHighTextContrastEnabled ?: false

// 检测系统字体缩放（200% 以上需特别关注布局裁切）
val fontScale = LocalDensity.current.fontScale
```

### 4. 语义分组与状态

* 相关元素用 `Modifier.semantics(mergeDescendants = true)` 合并为单个播报单元
* 自定义控件通过 `stateDescription` 暴露状态（"已选中"、"已展开"）
* 仅通过手势或长按触发的操作，必须同时提供 `customActions` 替代路径

语义分组与状态的完整代码见 [references/advanced-patterns.md](references/advanced-patterns.md)。

### 5. 焦点与导航顺序

* 焦点顺序：从上到下、Start 到 End
* 标题用 `Modifier.semantics { heading() }`，支持 TalkBack 按标题跳转
* 页面切换或 Dialog 关闭后，焦点移至逻辑目标
* 全部功能可通过 TalkBack、Switch Access、键盘操作

```kotlin
Text("设置", modifier = Modifier.semantics { heading() })
```

### 6. 自定义 Canvas 视图

Canvas 绘制的交互区对 TalkBack 完全不可见。View 体系实现 `ExploreByTouchHelper`；Compose 通过 `Modifier.semantics` 叠加语义节点。

## 审计流程

TalkBack 逐屏扫描 → Layout Inspector 测尺寸 → Accessibility Scanner 自动检测 → 外接键盘 Tab 遍历 → 200% 字体复测 → 粗体/高对比度复测。

## 反模式

### FAIL: 描述外观

```kotlin
Icon(Icons.Default.PlayArrow, contentDescription = "三角形图标")
// TalkBack 播报"三角形图标" → 用户不知道点了会发生什么
```

### PASS: 描述动作

```kotlin
IconButton(onClick = { playMusic() }) {
    Icon(Icons.Default.PlayArrow, contentDescription = "播放音乐")
}
```

### FAIL: 缩小按钮节省空间

```kotlin
IconButton(onClick = onFavorite, modifier = Modifier.size(24.dp)) {
    Icon(Icons.Default.Star, contentDescription = "收藏")
}
// 触摸区 24×24，老人/触屏精度差用户无法点中
```

### PASS: 视觉小但触摸区大

```kotlin
Box(
    modifier = Modifier.sizeIn(minWidth = 48.dp, minHeight = 48.dp)
        .clickable { onFavorite() },
    contentAlignment = Alignment.Center,
) {
    Icon(Icons.Default.Star, contentDescription = "收藏",
         modifier = Modifier.size(16.dp))
}
```

更多反模式见 [references/advanced-patterns.md](references/advanced-patterns.md)。
