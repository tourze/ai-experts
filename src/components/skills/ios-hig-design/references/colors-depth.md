# iOS 颜色与主题

## 语义颜色

使用能自动适应浅色/深色模式的语义颜色：

```swift
Color(.label)              // 主要文本
Color(.secondaryLabel)     // 次要文本
Color(.tertiaryLabel)      // 第三级文本
Color(.systemBackground)   // 主要背景
Color(.secondarySystemBackground)  // 提升/分组
Color(.systemBlue)         // 默认强调色
Color(.systemRed)          // 破坏性操作
Color(.systemGreen)        // 成功/确认
```

## 深色模式指南

1. **文本**：反转颜色（深色 → 浅色）
2. **背景**：转向更深色，同时保持相对层次
3. **强调色**：调整为在深色背景上突出（通常降低亮度，提高饱和度）

```swift
// 在开发过程中预览两种模式
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .preferredColorScheme(.light)
        ContentView()
            .preferredColorScheme(.dark)
    }
}
```

## 颜色对比度

最低对比度要求（WCAG）：
- **4.5:1** 用于普通文本
- **3:1** 用于大号文本（18pt+ 或 14pt+ 加粗）
- **3:1** 用于 UI 组件
