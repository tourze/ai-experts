---
name: swiftui-ui-patterns
description: 当用户需要构建或重构 SwiftUI 视图、导航、Tab 架构或组件拆分时使用。适用于新建界面、重构界面和查找项目内可复用范式。
---

# SwiftUI UI 模式

## 适用场景

- 新建 SwiftUI 页面、Tab 架构、导航流或弹层流程。
- 需要从现有项目中找可复用的 SwiftUI 组件模式。
- 需要给某个界面选择合适的 `TabView`、`NavigationStack`、`sheet`、`searchable` 或 `form` 方案。

## 核心约束

- 优先使用 SwiftUI 原生状态模型：`@State`、`@Binding`、`@Observable`、`@Environment`。
- `sheet` 状态能表达“选中了谁”时，优先用 `.sheet(item:)`，不要回退到布尔开关 + `if let`。
- 新建页面前先读 `references/components-index.md` 和 `references/app-wiring.md`，再决定是否需要额外 reference。
- 新增 reference 时必须是具体文件名，例如 `references/top-bar.md`，不要写占位路径。

## 代码模式

### App 级导航接线

```swift
enum AppTab: Hashable { case home, settings }

@main
struct MyApp: App {
    var body: some Scene {
        WindowGroup {
            TabView {
                NavigationStack { HomeView() }
                    .tabItem { Label("Home", systemImage: "house") }
                    .tag(AppTab.home)

                NavigationStack { SettingsView() }
                    .tabItem { Label("Settings", systemImage: "gear") }
                    .tag(AppTab.settings)
            }
        }
    }
}
```

### item 驱动的 sheet

```swift
@State private var selectedItem: Item?

.sheet(item: $selectedItem) { item in
    EditItemSheet(item: item)
}
```

### sheet 自己负责 dismiss

```swift
struct EditItemSheet: View {
    @Environment(\.dismiss) private var dismiss

    let item: Item

    var body: some View {
        Button("Save") {
            save(item)
            dismiss()
        }
    }
}
```

## 检查清单

- 先从 `references/components-index.md` 选择最接近的 reference，再实现页面。
- 新项目接线优先看 `references/app-wiring.md`；导航、分页、弹层分别看 `references/navigationstack.md`、`references/tabview.md`、`references/sheets.md`。
- 新界面是否把状态留在最近的拥有者，而不是先造 view model。
- 所有交互面是否有明确加载态、错误态和 dismiss / back 归属。
- 交叉引用：视图结构整理看 `swiftui-view-refactor`；平台设计规范看 `ios-hig-design` / `macos-design-guidelines`。

## 反模式

- 新页面一上来就塞一个“大而全” view model。
- `sheet(isPresented:)` 承担选择对象语义，内部再 `if let` 解包。
- 不看现有 reference，就重新发明一套导航和弹层模式。
- 在项目里留下“占位 reference 路径”却不真正落文件。
