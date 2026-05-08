# 输入工具栏（底部固定）

## 意图

为聊天、编辑器或快速操作使用底部固定的输入栏，而无需与键盘抗争。

## 核心模式

- 使用 `.safeAreaInset(edge: .bottom)` 在键盘上方固定工具栏。
- 将主要内容放在 `ScrollView` 或 `List` 中。
- 使用 `@FocusState` 驱动焦点，并在需要时设置初始焦点。
- 避免将输入栏嵌入滚动内容中；保持其独立。

## 示例：滚动视图 + 底部输入

```swift
@MainActor
struct ConversationView: View {
  @FocusState private var isInputFocused: Bool

  var body: some View {
    ScrollViewReader { _ in
      ScrollView {
        LazyVStack {
          ForEach(messages) { message in
            MessageRow(message: message)
          }
        }
        .padding(.horizontal, .layoutPadding)
      }
      .safeAreaInset(edge: .bottom) {
        InputBar(text: $draft)
          .focused($isInputFocused)
      }
      .scrollDismissesKeyboard(.interactively)
      .onAppear { isInputFocused = true }
    }
  }
}
```

## 要保留的设计选择

- 保持输入栏与可滚动内容视觉上分离。
- 对于聊天类界面使用 `.scrollDismissesKeyboard(.interactively)`。
- 确保发送操作可通过键盘回车或清晰的按钮到达。

## 陷阱

- 避免将输入视图放在滚动堆栈内部；它会随内容跳动。
- 避免争夺拖拽手势的嵌套滚动视图。
