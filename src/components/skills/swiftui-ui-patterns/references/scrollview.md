# ScrollView 和 Lazy 堆栈

## 意图

当需要自定义布局、混合内容或水平/基于网格的滚动时，使用 `ScrollView` 配合 `LazyVStack`、`LazyHStack` 或 `LazyVGrid`。

## 核心模式

- 对于聊天式或自定义 Feed 布局，优先使用 `ScrollView` + `LazyVStack`。
- 对于芯片、标签、头像和媒体条，使用 `ScrollView(.horizontal)` + `LazyHStack`。
- 对于图标/媒体网格，使用 `LazyVGrid`；尽可能使用自适应列。
- 使用 `ScrollViewReader` 实现滚动到顶部/底部和基于锚点的跳转。
- 使用 `safeAreaInset(edge:)` 实现应保持在键盘上方的输入栏。

## 示例：垂直自定义 Feed

```swift
@MainActor
struct ConversationView: View {
  private enum Constants { static let bottomAnchor = "bottom" }
  @State private var scrollProxy: ScrollViewProxy?

  var body: some View {
    ScrollViewReader { proxy in
      ScrollView {
        LazyVStack {
          ForEach(messages) { message in
            MessageRow(message: message)
              .id(message.id)
          }
          Color.clear.frame(height: 1).id(Constants.bottomAnchor)
        }
        .padding(.horizontal, .layoutPadding)
      }
      .safeAreaInset(edge: .bottom) {
        MessageInputBar()
      }
      .onAppear {
        scrollProxy = proxy
        withAnimation {
          proxy.scrollTo(Constants.bottomAnchor, anchor: .bottom)
        }
      }
    }
  }
}
```

## 示例：水平芯片

```swift
ScrollView(.horizontal, showsIndicators: false) {
  LazyHStack(spacing: 8) {
    ForEach(chips) { chip in
      ChipView(chip: chip)
    }
  }
}
```

## 示例：自适应网格

```swift
let columns = [GridItem(.adaptive(minimum: 120))]

ScrollView {
  LazyVGrid(columns: columns, spacing: 8) {
    ForEach(items) { item in
      GridItemView(item: item)
    }
  }
  .padding(8)
}
```

## 要保留的设计选择

- 当项目数量大或未知时使用 `Lazy*` 堆栈。
- 对于小型、固定大小的内容使用非懒加载堆栈，以避免懒加载的开销。
- 使用 `ScrollViewReader` 时保持 ID 稳定。
- 在滚动到某个 ID 时优先使用显式动画（`withAnimation`）。

## 陷阱

- 避免嵌套同轴的滚动视图；会导致手势冲突。
- 没有明确理由不要在同一层次结构中组合 `List` 和 `ScrollView`。
- 对微小内容过度使用 `LazyVStack` 可能增加不必要的复杂性。
