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
