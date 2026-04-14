---
name: android-accessibility
description: Android 无障碍审计与修复，聚焦 Jetpack Compose 的 TalkBack 语义化、触摸目标、色彩对比度和焦点管理。
---

# Android 无障碍审计

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

```kotlin
// 列表项合并播报：图标 + 标题 + 副标题 → 一个播报单元
Row(
    modifier = Modifier
        .semantics(mergeDescendants = true) { }
        .clickable { onItemClick() }
) {
    Icon(Icons.Default.Person, contentDescription = null)
    Column {
        Text("用户名")
        Text("在线", style = MaterialTheme.typography.bodySmall)
    }
}

// 自定义 toggle 暴露状态
var checked by remember { mutableStateOf(false) }
Box(
    modifier = Modifier
        .toggleable(value = checked, onValueChange = { checked = it })
        .semantics {
            stateDescription = if (checked) "已开启" else "已关闭"
        }
)
```

### 5. 焦点与导航顺序

* 焦点顺序遵循从上到下、从 Start 到 End 的逻辑顺序
* 标题文本标记 `Modifier.semantics { heading() }`，支持 TalkBack 按标题跳转
* 页面切换或 Dialog 关闭后，焦点移至逻辑目标位置
* 全部功能可通过 TalkBack、Switch Access、外接键盘完成操作

```kotlin
// 标题标记
Text(
    text = "设置",
    style = MaterialTheme.typography.headlineMedium,
    modifier = Modifier.semantics { heading() }
)
```

### 6. 自定义 Canvas 视图

* 使用 Canvas 绘制的交互区域对 TalkBack **完全不可见**
* View 体系：必须实现 `ExploreByTouchHelper` 构建虚拟无障碍树
* Compose：通过 `Modifier.semantics` 在 Canvas 上层叠加语义节点

## 审计流程

```
1. 开启 TalkBack → 逐屏扫描 → 确认每个可交互元素都有播报
2. Layout Inspector → 测量所有可点击元素尺寸 → 确认 ≥ 48dp
3. Accessibility Scanner → 自动检测对比度和触摸目标问题
4. 外接键盘 → Tab 遍历 → 确认所有功能可达
5. 系统设置 200% 字体 → 确认无裁切和重叠
6. 开启粗体文本 / 高对比度 → 确认界面正常显示
```

## 反模式

| 做法 | 问题 | 正确方式 |
|------|------|----------|
| 所有图片都设 `contentDescription` | 装饰性图片干扰播报 | 装饰性图片设 `null` |
| `contentDescription = "icon"` | 无意义描述 | 描述动作或含义 |
| 缩小按钮节省空间 | 触摸目标 < 48dp | 保持 48dp 触摸区域，视觉可以缩小 |
| 仅用红色标记错误 | 色盲用户无法识别 | 颜色 + 图标 + 文字 |
| Canvas 自绘 UI 无语义 | TalkBack 完全不可见 | 添加 ExploreByTouchHelper |
