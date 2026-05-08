# 列表和 Section

## 意图

使用 `List` 实现 Feed 类型内容和设置风格的行，其中内置的行重用、选择和无障碍性至关重要。

## 核心模式

- 对于具有重复行的长垂直滚动内容，优先使用 `List`。
- 使用 `Section` 头部对相关行进行分组。
- 当需要滚动到顶部或跳转到指定 ID 时，配合 `ScrollViewReader` 使用。
- 对于现代 Feed 布局使用 `.listStyle(.plain)`。
- 对于多 Section 的发现/搜索页面，当 Section 分组有助于导航时，使用 `.listStyle(.grouped)`。
- 当需要主题化背景时，使用 `.scrollContentBackground(.hidden)` 加自定义背景。
- 使用 `.listRowInsets(...)` 和 `.listRowSeparator(.hidden)` 调整行间距和分隔线。
- 使用 `.environment(\\.defaultMinListRowHeight, ...)` 控制紧凑列表布局。

## 示例：带滚动到顶部的 Feed 列表

```swift
@MainActor
struct TimelineListView: View {
  @Environment(\.selectedTabScrollToTop) private var selectedTabScrollToTop
  @State private var scrollToId: String?

  var body: some View {
    ScrollViewReader { proxy in
      List {
        ForEach(items) { item in
          TimelineRow(item: item)
            .id(item.id)
            .listRowInsets(.init(top: 12, leading: 16, bottom: 6, trailing: 16))
            .listRowSeparator(.hidden)
        }
      }
      .listStyle(.plain)
      .environment(\\.defaultMinListRowHeight, 1)
      .onChange(of: scrollToId) { _, newValue in
        if let newValue {
          proxy.scrollTo(newValue, anchor: .top)
          scrollToId = nil
        }
      }
      .onChange(of: selectedTabScrollToTop) { _, newValue in
        if newValue == 0 {
          withAnimation {
            proxy.scrollTo(ScrollToView.Constants.scrollToTop, anchor: .top)
          }
        }
      }
    }
  }
}
```

## 示例：设置风格列表

```swift
@MainActor
struct SettingsView: View {
  var body: some View {
    List {
      Section("General") {
        NavigationLink("Display") { DisplaySettingsView() }
        NavigationLink("Haptics") { HapticsSettingsView() }
      }
      Section("Account") {
        Button("Sign Out", role: .destructive) {}
      }
    }
    .listStyle(.insetGrouped)
  }
}
```

## 要保留的设计选择

- 对于动态 Feed、设置以及任何行语义有帮助的 UI，使用 `List`。
- 为行使用稳定的 ID，以保持动画和滚动定位可靠。
- 对于应该可以点击整行的行，优先使用 `.contentShape(Rectangle())`。
- 当数据源支持时，对 Feed 使用 `.refreshable` 实现下拉刷新。

## 陷阱

- 避免在 `List` 行内部使用重量级自定义布局；改用 `ScrollView` + `LazyVStack`。
- 混合使用 `List` 和嵌套的 `ScrollView` 时要小心；可能导致手势冲突。
