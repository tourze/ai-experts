# Android 无障碍 — 高级模式

本文件是 android-accessibility SKILL.md 的拆分内容，包含内容描述、触摸目标、对比度、语义分组、焦点管理和反模式的完整代码。

## 内容描述

### PASS: 描述动作

```kotlin
IconButton(onClick = { playMusic() }) {
    Icon(Icons.Default.PlayArrow, contentDescription = "播放音乐")
}
```

### PASS: 纯装饰图片不进入语义树

```kotlin
Image(painter, contentDescription = null)
```

### FAIL: 描述图标外观

```kotlin
Icon(Icons.Default.PlayArrow, contentDescription = "三角形图标")
```

## 触摸目标

### 自定义小图标扩大触摸区域

```kotlin
Box(
    modifier = Modifier
        .sizeIn(minWidth = 48.dp, minHeight = 48.dp)
        .clickable { onFavorite() },
    contentAlignment = Alignment.Center,
) {
    Icon(
        Icons.Default.Star,
        contentDescription = "收藏",
        modifier = Modifier.size(16.dp),
    )
}
```

## 色彩对比度与字体缩放

```kotlin
val context = LocalContext.current
val accessibilityManager = context.getSystemService<AccessibilityManager>()
val isHighTextContrast = accessibilityManager?.isHighTextContrastEnabled ?: false

val fontScale = LocalDensity.current.fontScale
```

## 语义分组与状态 — 代码示例

### 列表项合并播报

```kotlin
// 图标 + 标题 + 副标题 → 一个播报单元
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
```

### 自定义 toggle 暴露状态

```kotlin
var checked by remember { mutableStateOf(false) }
Box(
    modifier = Modifier
        .toggleable(value = checked, onValueChange = { checked = it })
        .semantics {
            stateDescription = if (checked) "已开启" else "已关闭"
        }
)
```

## 焦点与导航

```kotlin
Text("设置", modifier = Modifier.semantics { heading() })
```

## 反模式

### FAIL: 仅用颜色标错误

```kotlin
Text(field.value, color = if (field.hasError) Color.Red else Color.Black)
// 色盲用户无法识别
```

### PASS: 颜色 + 图标 + 文字

```kotlin
if (field.hasError) Icon(Icons.Default.Error, contentDescription = null)
Text(field.value, color = if (field.hasError) errorColor else textColor)
if (field.hasError) Text("此字段必填", style = errorStyle)
```
