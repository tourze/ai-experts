# macOS 设置

## 意图

使用此模式构建由 SwiftUI 的 `Settings` 场景支持的 macOS 设置窗口。

## 核心模式

- 在 `App` 中声明 Settings 场景，并仅针对 macOS 编译。
- 将设置内容放在专用的根视图（`SettingsView`）中，并使用 `@AppStorage` 驱动值。
- 当有多个类别时，使用 `TabView` 对设置 Section 进行分组。
- 在每个标签内使用 `Form` 保持控件对齐和可访问。
- 使用 `OpenSettingsAction` 或 `SettingsLink` 作为应用内入口点进入 Settings 窗口。

## 示例：设置场景

```swift
@main
struct MyApp: App {
  var body: some Scene {
    WindowGroup {
      ContentView()
    }
    #if os(macOS)
    Settings {
      SettingsView()
    }
    #endif
  }
}
```

## 示例：标签式设置视图

```swift
@MainActor
struct SettingsView: View {
  @AppStorage("showPreviews") private var showPreviews = true
  @AppStorage("fontSize") private var fontSize = 12.0

  var body: some View {
    TabView {
      Form {
        Toggle("Show Previews", isOn: $showPreviews)
        Slider(value: $fontSize, in: 9...96) {
          Text("Font Size (\(fontSize, specifier: "%.0f") pts)")
        }
      }
      .tabItem { Label("General", systemImage: "gear") }

      Form {
        Toggle("Enable Advanced Mode", isOn: .constant(false))
      }
      .tabItem { Label("Advanced", systemImage: "star") }
    }
    .scenePadding()
    .frame(maxWidth: 420, minHeight: 240)
  }
}
```

## 跳过导航

- 除非确实需要深层推送导航，否则避免将 `SettingsView` 包裹在 `NavigationStack` 中。
- 优先使用标签页或 Section；Settings 已经作为独立窗口呈现，应该感觉扁平。
- 如果必须显示分层设置，使用单个 `NavigationSplitView` 配合侧边栏类别列表。

## 陷阱

- 不要重复使用仅 iOS 的设置布局（全屏堆栈、大量工具栏的流程）。
- 避免在 `Form` 内部使用大型自定义视图层次；保持行聚焦且可无障碍访问。
