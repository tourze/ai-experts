# Android 无障碍 — 高级模式

本文件是 android-accessibility SKILL.md 的拆分内容，包含语义分组、焦点管理和反模式的完整代码。

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
