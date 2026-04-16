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

- 把液态玻璃当作“任何地方都能加”的视觉糖。
- 不做系统版本判断，直接把新 API 下沉到全量代码路径。
- 用玻璃替代信息层次，导致文本对比度和可读性下降。
- 多元素玻璃不放容器，最后用手工阴影和遮罩补救。
