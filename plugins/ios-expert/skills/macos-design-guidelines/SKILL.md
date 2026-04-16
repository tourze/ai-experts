---
name: macos-design-guidelines
description: 当用户要按 Apple Human Interface Guidelines 设计 macOS 原生界面时使用。适用于菜单栏、窗口、工具栏、键盘快捷键、侧边栏和桌面交互。
license: MIT
metadata:
  author: platform-design-skills
  version: "1.0.0"
---

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
- 需要展开规则时读取 `AGENTS.md`、`rules/_sections.md` 和 `metadata.json`。
- 交叉引用：iPhone / iPad 体验看 `ios-hig-design`；SwiftUI 具体实现看 `swiftui-ui-patterns`。

## 反模式

- 用 iPad 底部 TabBar 直接套在 Mac 主窗口。
- 把重要命令只放在悬浮按钮，不进菜单栏和快捷键。
- 窗口不可调大小，或者默认尺寸对桌面内容明显过窄。
- 设计上完全忽略右键、拖拽和多选。
