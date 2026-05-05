# Liquid Glass 进阶模式

本文件是 liquid-glass-design SKILL.md 的拆分内容，包含 WidgetKit 渲染模式与额外反模式的完整代码。

## WidgetKit 渲染模式

```swift
struct MyWidgetView: View {
    @Environment(\.widgetRenderingMode) private var renderingMode

    var body: some View {
        VStack(alignment: .leading) {
            Text("Today")
                .widgetAccentable()
            Text("3 tasks due")
        }
        .containerBackground(for: .widget) {
            Color.blue.opacity(renderingMode == .accented ? 0.15 : 0.25)
        }
    }
}
```

## 反模式

### FAIL: 多元素不放容器

```swift
HStack {
    Image(systemName: "a").glassEffect()  // 独立玻璃
    Image(systemName: "b").glassEffect()  // 独立玻璃
    Image(systemName: "c").glassEffect()
}
// 三块独立模糊层 → 性能下降 + 边缘融合断裂
// 后期用阴影/遮罩硬补救
```

### PASS: GlassEffectContainer 统一

```swift
GlassEffectContainer(spacing: 24) {
    HStack(spacing: 24) {
        Image(systemName: "a").frame(width: 72, height: 72).glassEffect()
        Image(systemName: "b").frame(width: 72, height: 72).glassEffect()
    }
}
// 系统统一管理融合 + 性能优化
```

### FAIL: 玻璃替代信息层次

```swift
ZStack {
    Color.gray.glassEffect()  // 整页玻璃
    Text("用户：alice").foregroundColor(.white.opacity(0.6))
    Text("订单：1234").foregroundColor(.white.opacity(0.6))
}
// 文本对比度 < 3:1 → WCAG 失败
// 用户可读性差，但"看起来很高级"
```

### PASS: 玻璃只用于强调层

```swift
ScrollView {
    LazyVStack(alignment: .leading) {
        ForEach(items) { item in
            Text(item.title).foregroundStyle(.primary)  // 主信息常规渲染
        }
    }
}
.safeAreaInset(edge: .top) {
    Toolbar()
        .glassEffect(.regular.interactive())  // 仅工具栏强调用玻璃
}
```
