---
name: liquid-glass-design
description: 当用户要在 iOS 26 中使用液态玻璃设计系统时使用。适用于 SwiftUI、UIKit 与 WidgetKit 的玻璃材质、容器融合、交互反馈与变形过渡。
---

# Liquid Glass 设计

## 适用场景

- 为 iOS 26+ / iPadOS 26+ 界面引入新一代玻璃材质。
- 需要实现玻璃按钮、工具栏、卡片、浮层或元素之间的变形过渡。
- 需要让 WidgetKit 在 full color / accented 模式下保持正确视觉层次。

## 核心约束

- 仅在目标系统支持 Liquid Glass API 时使用；旧系统必须保留材质回退方案。
- 多个玻璃元素优先放进 `GlassEffectContainer`，否则融合与性能都不稳定。
- `interactive()` 只给真正可交互的元素，不要让纯装饰层伪装成交互层。
- 玻璃是强调层次的材料，不是把整页 UI 全部磨成同一块雾面板。

## 代码模式

### SwiftUI 基础玻璃

```swift
Text("Focus")
    .font(.title2.weight(.semibold))
    .padding(.horizontal, 20)
    .padding(.vertical, 12)
    .glassEffect(.regular.tint(.blue).interactive(), in: .capsule)
```

### 多元素融合

```swift
GlassEffectContainer(spacing: 24) {
    HStack(spacing: 24) {
        Image(systemName: "scribble.variable")
            .frame(width: 72, height: 72)
            .glassEffect()

        Image(systemName: "eraser.fill")
            .frame(width: 72, height: 72)
            .glassEffect()
    }
}
```

### WidgetKit 渲染模式

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

## 检查清单

- 确认部署目标与回退策略，不要让旧系统直接编译失败。
- 多个玻璃元素是否已经放入统一容器，并验证间距带来的融合效果。
- 是否只在重要交互位使用 `interactive()`，而不是整页都带动态反馈。
- Widget 是否同时检查 full color 与 accented 模式。
- 交叉引用：整体 iOS 界面规范看 `ios-hig-design`；SwiftUI 结构化实现看 `swiftui-ui-patterns`。

## 反模式

### FAIL: 不做版本判断

```swift
Text("Focus")
    .glassEffect(.regular)  // iOS 26+ API
// iOS 17/18 设备：编译错误 / 运行 crash
```

### PASS: availability 兜底

```swift
extension View {
    @ViewBuilder
    func adaptiveGlass() -> some View {
        if #available(iOS 26, *) {
            self.glassEffect(.regular.tint(.blue))
        } else {
            self.background(.ultraThinMaterial)  // 旧版本回退
        }
    }
}
Text("Focus").adaptiveGlass()
```

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
