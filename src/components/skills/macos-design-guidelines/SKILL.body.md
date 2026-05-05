## 代码模式

### 标准菜单与设置

```swift
@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup { ContentView() }
        Settings { SettingsView() }
        .commands {
            CommandMenu("Canvas") {
                Button("Zoom to Fit") { zoomToFit() }
                    .keyboardShortcut("0", modifiers: .command)
            }
        }
    }
}
```

### 合理的窗口尺寸

```swift
WindowGroup {
    ContentView()
        .frame(minWidth: 700, minHeight: 480)
}
.defaultSize(width: 980, height: 640)
```

### 原生分栏与工具栏

```swift
NavigationSplitView {
    SidebarView()
} detail: {
    DetailView()
        .toolbar {
            ToolbarItem {
                Button("Refresh") { reload() }
            }
        }
}
```
