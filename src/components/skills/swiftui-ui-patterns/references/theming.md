# 主题和动态类型

## 意图

提供一种干净、可扩展的主题化方法，使视图代码保持语义化和一致性。

## 核心模式

- 使用单一的 `Theme` 对象作为事实源（颜色、字体、间距）。
- 在应用根视图注入主题，并通过 `@Environment(Theme.self)` 在视图中读取。
- 优先使用语义颜色（`primaryBackground`、`secondaryBackground`、`label`、`tint`）而非原始颜色。
- 将面向用户的主题控制放在专用的设置界面中。
- 通过自定义字体或 `.font(.scaled...)` 应用 Dynamic Type 缩放。

## 示例：Theme 对象

```swift
@MainActor
@Observable
final class Theme {
  var tintColor: Color = .blue
  var primaryBackground: Color = .white
  var secondaryBackground: Color = .gray.opacity(0.1)
  var labelColor: Color = .primary
  var fontSizeScale: Double = 1.0
}
```

## 示例：在应用根视图注入

```swift
@main
struct MyApp: App {
  @State private var theme = Theme()

  var body: some Scene {
    WindowGroup {
      AppView()
        .environment(theme)
    }
  }
}
```

## 示例：视图使用

```swift
struct ProfileView: View {
  @Environment(Theme.self) private var theme

  var body: some View {
    VStack {
      Text("Profile")
        .foregroundStyle(theme.labelColor)
    }
    .background(theme.primaryBackground)
  }
}
```

## 要保留的设计选择

- 保持主题值语义化和最小化；避免重复系统颜色。
- 如有需要，将用户选择的主题值存储在持久化存储中。
- 确保文本和背景之间的对比度。

## 陷阱

- 避免在视图中散布原始 `Color` 值；这会破坏一致性。
- 不要将主题绑定到单个视图的本地状态。
- 避免仅使用 `@Environment(\\.colorScheme)` 作为主题控制；它应补充你的主题。
