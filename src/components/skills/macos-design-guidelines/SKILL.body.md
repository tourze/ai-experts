# macOS HIG 设计

## 适用场景

- 设计或评审 macOS 的 SwiftUI / AppKit 界面。
- 用户提到菜单栏、窗口、多窗口、工具栏、快捷键、侧边栏或 Mac Catalyst 桌面体验。
- 需要把 iPad 式界面改回真正符合 Mac 习惯的桌面产品。

## 核心约束

- 菜单栏、窗口管理和键盘快捷键是 Mac 的一等入口，优先级高于视觉装饰。
- 主窗口必须可调整大小，并给出合理的最小尺寸与默认尺寸。
- 常见命令应该进入标准菜单或工具栏，不要藏在悬浮按钮里。
- Mac 用户默认期待右键、拖拽、多窗口和键盘导航，不要按 iPhone 的交互假设来设计。

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

## 检查清单

- 是否提供标准菜单、设置入口、常用快捷键和上下文菜单。
- 主窗口是否支持调整大小、全屏和多窗口，而不是被固定成移动端画布。
- 侧边栏、工具栏、搜索和右键菜单是否体现桌面工作流。
- 需要展开规则时读取记忆文件、`rules/_sections.md` 和 `metadata.json`。
- 交叉引用：iPhone / iPad 体验看 `ios-hig-design`；SwiftUI 具体实现看 `swiftui-ui-patterns`。

## 反模式

### FAIL: TabBar 直接搬上 Mac

```swift
TabView {
    HomeView().tabItem { Label("Home", systemImage: "house") }
    ProfileView().tabItem { Label("Me", systemImage: "person") }
}
// macOS 底部出现 iPhone 风格 tab bar
// Mac 用户预期：sidebar / 顶部菜单
```

### PASS: NavigationSplitView

```swift
NavigationSplitView {
    List(sections, selection: $selected) { section in
        NavigationLink(value: section) { Label(section.name, systemImage: section.icon) }
    }
} detail: {
    DetailView(section: selected)
}
// 原生 sidebar + 工具栏 + 多窗口 + 拖拽
```

### FAIL: 命令只在悬浮按钮

```swift
ContentView()
    .overlay(alignment: .bottomTrailing) {
        Button("New Document") { create() }
            .padding()
    }
// 没有 ⌘N 快捷键
// 菜单栏 File 菜单是空的
// Mac 用户：找了 5 分钟才看到右下角按钮
```

### PASS: 命令进菜单 + 快捷键

```swift
.commands {
    CommandGroup(replacing: .newItem) {
        Button("New Document") { create() }
            .keyboardShortcut("n", modifiers: .command)
    }
}
// File → New Document（⌘N）
// 同时也可保留按钮
```

### FAIL: 窗口固定尺寸

```swift
WindowGroup {
    ContentView().frame(width: 400, height: 300)  // 写死
}
// 用户拖动 → 内容溢出
// 4K 显示器 → 窗口巴掌大
```

### PASS: min + default + 可调

```swift
WindowGroup {
    ContentView().frame(minWidth: 700, minHeight: 480)
}
.defaultSize(width: 980, height: 640)
.windowResizability(.contentMinSize)
// 用户可放大，最小尺寸防止 UI 崩
```
