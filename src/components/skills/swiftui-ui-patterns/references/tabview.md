# TabView

## 意图

使用此模式实现可扩展的多平台标签架构，具备：
- 标签标识和内容的单一事实源，
- 平台特定的标签集和侧边栏 Section，
- 源自数据的动态标签，
- 特殊标签的拦截钩子（例如编辑）。

## 核心架构

- `AppTab` 枚举定义标识、标签、图标和内容构建器。
- `SidebarSections` 枚举为侧边栏 Section 对标签进行分组。
- `AppView` 拥有 `TabView` 和选择绑定，并通过 `updateTab` 路由标签变化。

## 示例：带副作用的自定义绑定

当标签选择需要副作用，如拦截特殊标签以执行操作而非更改选择时使用。

```swift
@MainActor
struct AppView: View {
  @Binding var selectedTab: AppTab

  var body: some View {
    TabView(selection: .init(
      get: { selectedTab },
      set: { updateTab(with: $0) }
    )) {
      ForEach(availableSections) { section in
        TabSection(section.title) {
          ForEach(section.tabs) { tab in
            Tab(value: tab) {
              tab.makeContentView(
                homeTimeline: $timeline,
                selectedTab: $selectedTab,
                pinnedFilters: $pinnedFilters
              )
            } label: {
              tab.label
            }
            .tabPlacement(tab.tabPlacement)
          }
        }
        .tabPlacement(.sidebarOnly)
      }
    }
  }

  private func updateTab(with newTab: AppTab) {
    if newTab == .post {
      // 拦截特殊标签（编辑）而不是更改选择。
      presentComposer()
      return
    }
    selectedTab = newTab
  }
}
```

## 示例：无副作用的直接绑定

当选择纯粹由状态驱动时使用。

```swift
@MainActor
struct AppView: View {
  @Binding var selectedTab: AppTab

  var body: some View {
    TabView(selection: $selectedTab) {
      ForEach(availableSections) { section in
        TabSection(section.title) {
          ForEach(section.tabs) { tab in
            Tab(value: tab) {
              tab.makeContentView(
                homeTimeline: $timeline,
                selectedTab: $selectedTab,
                pinnedFilters: $pinnedFilters
              )
            } label: {
              tab.label
            }
            .tabPlacement(tab.tabPlacement)
          }
        }
        .tabPlacement(.sidebarOnly)
      }
    }
  }
}
```

## 要保留的设计选择

- 使用 `makeContentView(...)` 在 `AppTab` 中集中管理标签标识和内容。
- 使用 `Tab(value:)` 与 `selection` 绑定实现状态驱动的标签选择。
- 通过 `updateTab` 路由选择变化，以处理特殊标签和滚动到顶部的行为。
- 使用 `TabSection` + `.tabPlacement(.sidebarOnly)` 实现侧边栏结构。
- 在 `AppTab.tabPlacement` 中使用 `.tabPlacement(.pinned)` 实现单个固定标签；这通常用于 iOS 26 的 `.searchable` 标签内容，但也可用于任何标签。

## 动态标签模式

- `SidebarSections` 处理动态数据标签。
- `AppTab.anyTimelineFilter(filter:)` 将动态标签包装在单个枚举 case 中。
- 枚举通过过滤器类型为动态标签提供标签/图标/标题。

## 陷阱

- 避免为标签添加 ViewModel；保持状态本地化或在 `@Observable` 服务中。
- 不要在其他 `@Observable` 对象内部嵌套 `@Observable` 对象。
- 确保 `AppTab.id` 值稳定；动态 case 应在稳定 ID 上哈希。
- 特殊标签（编辑）不应更改选择。
