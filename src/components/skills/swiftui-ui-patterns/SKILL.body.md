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
