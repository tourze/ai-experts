# iOS 无障碍

## VoiceOver 支持

每个交互元素都需要无障碍标签：

```swift
// 无障碍标签（它是什么）
Image(systemName: "heart.fill")
    .accessibilityLabel("Favorite")

// 无障碍值（当前状态）
Slider(value: $volume)
    .accessibilityLabel("Volume")
    .accessibilityValue("\(Int(volume * 100))%")

// 无障碍提示（它做什么）
Button("Share") { share() }
    .accessibilityHint("Shares this item with others")

// 组合相关元素
HStack {
    Image(systemName: "person")
    Text("John Doe")
}
.accessibilityElement(children: .combine)
```

## 动态类型

支持用户字体大小偏好：

```swift
// 使用语义文本样式（自动缩放）
Text("Content")
    .font(.body)

// 对于自定义字体，使用 Dynamic Type 缩放
@ScaledMetric var customSize: CGFloat = 16

Text("Custom")
    .font(.system(size: customSize))
```

## 高对比度模式

```swift
@Environment(\.colorSchemeContrast) var contrast

var textColor: Color {
    contrast == .increased ? .primary : .secondary
}
```

## 无障碍检查清单

- [ ] 所有图片都有无障碍标签
- [ ] 触摸目标至少为 44×44pt
- [ ] 文本随 Dynamic Type 缩放
- [ ] 颜色对比度符合 WCAG 标准
- [ ] 动画效果可以减少
- [ ] VoiceOver 导航符合逻辑
- [ ] 不单独依赖颜色传达含义
