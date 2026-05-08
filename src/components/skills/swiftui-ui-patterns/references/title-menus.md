# 标题菜单

## 意图

在导航栏中使用标题菜单提供上下文相关的筛选或快速操作，无需额外装饰元素。

## 核心模式

- 使用 `ToolbarTitleMenu` 将菜单附加到导航标题。
- 保持菜单内容紧凑，并使用分隔线分组。

## 示例：筛选器的标题菜单

```swift
@ToolbarContentBuilder
private var toolbarView: some ToolbarContent {
  ToolbarTitleMenu {
    Button("Latest") { timeline = .latest }
    Button("Resume") { timeline = .resume }
    Divider()
    Button("Local") { timeline = .local }
    Button("Federated") { timeline = .federated }
  }
}
```

## 示例：附加到视图

```swift
NavigationStack {
  TimelineView()
    .toolbar {
      toolbarView
    }
}
```

## 示例：标题 + 菜单结合

```swift
struct TimelineScreen: View {
  @State private var timeline: TimelineFilter = .home

  var body: some View {
    NavigationStack {
      TimelineView()
        .toolbar {
          ToolbarItem(placement: .principal) {
            VStack(spacing: 2) {
              Text(timeline.title)
                .font(.headline)
              Text(timeline.subtitle)
                .font(.caption)
                .foregroundStyle(.secondary)
            }
          }

          ToolbarTitleMenu {
            Button("Home") { timeline = .home }
            Button("Local") { timeline = .local }
            Button("Federated") { timeline = .federated }
          }
        }
        .navigationBarTitleDisplayMode(.inline)
    }
  }
}
```

## 示例：标题 + 副标题带菜单

```swift
ToolbarItem(placement: .principal) {
  VStack(spacing: 2) {
    Text(title)
      .font(.headline)
    Text(subtitle)
      .font(.caption)
      .foregroundStyle(.secondary)
  }
}
```

## 要保留的设计选择

- 仅在有筛选或上下文切换可用时显示标题菜单。
- 保持标题可读；避免导致截断的长标签。
- 如果需要额外上下文，在标题下方使用次要文本。

## 陷阱

- 不要用太多选项使菜单过载。
- 避免将标题菜单用于破坏性操作。
