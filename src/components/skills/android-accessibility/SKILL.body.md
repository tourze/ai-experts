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
