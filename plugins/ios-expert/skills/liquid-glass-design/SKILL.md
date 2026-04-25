---
name: liquid-glass-design
description: 当用户要在 iOS 26 做 Liquid Glass、玻璃材质、容器融合、WidgetKit 外观、变形过渡或视觉层级时使用。
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

WidgetKit 渲染模式与更多代码模式见 [references/advanced-patterns.md](references/advanced-patterns.md)。

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

更多反模式见 [references/advanced-patterns.md](references/advanced-patterns.md)。
