# 分割视图和列

## 意图

为 iPad/macOS 提供轻量级、可定制的多列布局，而不依赖 `NavigationSplitView`。

## 自定义分割列模式（手动 HStack）

当需要对列尺寸、行为和环境调整拥有完全控制时使用此模式。

```swift
@MainActor
struct AppView: View {
  @Environment(\.horizontalSizeClass) private var horizontalSizeClass
  @AppStorage("showSecondaryColumn") private var showSecondaryColumn = true

  var body: some View {
    HStack(spacing: 0) {
      primaryColumn
      if shouldShowSecondaryColumn {
        Divider().edgesIgnoringSafeArea(.all)
        secondaryColumn
      }
    }
  }

  private var shouldShowSecondaryColumn: Bool {
    horizontalSizeClass == .regular
      && showSecondaryColumn
  }

  private var primaryColumn: some View {
    TabView { /* tabs */ }
  }

  private var secondaryColumn: some View {
    NotificationsTab()
      .environment(\.isSecondaryColumn, true)
      .frame(maxWidth: .secondaryColumnWidth)
  }
}
```

## 关于自定义方法的说明

- 使用共享的偏好设置或配置来切换副列。
- 注入环境标志（例如 `isSecondaryColumn`），使子视图可以调整行为。
- 为副列使用固定或带上限的宽度，避免布局抖动。

## 替代方案：NavigationSplitView

`NavigationSplitView` 可以帮你处理侧边栏 + 详情 + 补充列，但在以下情况下难以自定义：
- 独立于选择的专用通知列，
- 自定义尺寸，或
- 每列不同的工具栏行为。

```swift
@MainActor
struct AppView: View {
  var body: some View {
    NavigationSplitView {
      SidebarView()
    } content: {
      MainContentView()
    } detail: {
      NotificationsView()
    }
  }
}
```

## 何时选择哪种方案

- 当需要完全控制或非标准副列时，使用手动 HStack 分割。
- 当需要标准系统布局且只需最小自定义时，使用 `NavigationSplitView`。
