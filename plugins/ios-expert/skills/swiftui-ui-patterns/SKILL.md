---
name: swiftui-ui-patterns
description: 当用户需要构建、重构或拆分 SwiftUI 视图、导航、Tab 架构、组件模式或依赖注入时使用。适用于新建界面、整理视图结构、收敛 Observation 用法和查找可复用范式。
---

# SwiftUI UI 模式

## 适用场景

- 新建 SwiftUI 页面、Tab 架构、导航流或弹层流程。
- 需要从现有项目中找可复用的 SwiftUI 组件模式。
- 需要给某个界面选择合适的 `TabView`、`NavigationStack`、`sheet`、`searchable` 或 `form` 方案。
- 需要整理视图文件顺序、拆分臃肿 `body`、收敛依赖注入或 `@Observable` 使用方式。
- 需要把"可选 view model + bootstrapIfNeeded"改成可维护模式。

## 核心约束

- 优先使用 SwiftUI 原生状态模型：`@State`、`@Binding`、`@Observable`、`@Environment`。
- `sheet` 状态能表达”选中了谁”时，优先用 `.sheet(item:)`，不要回退到布尔开关 + `if let`。
- 新建页面前先读 `references/components-index.md` 和 `references/app-wiring.md`，再决定是否需要额外 reference。
- 新增 reference 时必须是具体文件名，例如 `references/top-bar.md`，不要写占位路径。
- 重构时先保证行为不变，再整理结构；重构不是顺手改交互。
- 默认走 MV：视图负责状态表达和轻量编排，业务逻辑留在模型 / 服务层。
- 如果 view model 已存在，优先让它变成非可选并在 `init` 中完成注入。
- 需要理念展开时读取 `references/mv-patterns.md`，不要另造一套术语。

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

### 视图重构模式

成员顺序、`body` 拆分、Observation 持有和重构反模式见 `references/view-refactoring.md`；MV 理念展开见 `references/mv-patterns.md`。

## 检查清单

- 先从 `references/components-index.md` 选择最接近的 reference，再实现页面。
- 新项目接线优先看 `references/app-wiring.md`；导航、分页、弹层分别看 `references/navigationstack.md`、`references/tabview.md`、`references/sheets.md`。
- 新界面是否把状态留在最近的拥有者，而不是先造 view model。
- 所有交互面是否有明确加载态、错误态和 dismiss / back 归属。
- 视图文件顺序是否统一为：环境依赖 → `let` → `@State` → 非视图计算属性 → `init` → `body` → 子视图 / helper。
- 大型 `body` 是否拆成可命名的子区域，而不是继续堆条件分支。
- 是否移除了不必要的可选 view model、`bootstrapIfNeeded` 和重复包装。
- 根视图是否正确持有 `@Observable`，下游只接收必要输入。
- 交叉引用：并发边界问题看 `swift-concurrency-expert`；性能与重渲染看 `swiftui-performance-audit`；平台设计规范看 `ios-hig-design` / `macos-design-guidelines`。

## 反模式

### FAIL: sheet(isPresented:) + if let 解包

```swift
@State private var showEdit = false
@State private var selectedItem: Item?

Button(“Edit”) { selectedItem = item; showEdit = true }
.sheet(isPresented: $showEdit) {
    if let item = selectedItem { EditSheet(item: item) }
    else { EmptyView() }
}
```

### PASS: sheet(item:) 绑定数据

```swift
@State private var selectedItem: Item?
Button(“Edit”) { selectedItem = item }
.sheet(item: $selectedItem) { item in EditSheet(item: item) }
```

### FAIL: 小页面也造 view model

```swift
struct SettingsView: View {
    @State private var viewModel = SettingsViewModel()
    var body: some View {
        Toggle(“Dark Mode”, isOn: $viewModel.isDarkMode)
        // VM 里就两个布尔，毫无必要
    }
}
```

### PASS: 状态就近持有

```swift
struct SettingsView: View {
    @AppStorage(“darkMode”) private var isDarkMode = false
    var body: some View { Toggle(“Dark Mode”, isOn: $isDarkMode) }
}
```
