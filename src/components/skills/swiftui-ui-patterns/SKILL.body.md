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
