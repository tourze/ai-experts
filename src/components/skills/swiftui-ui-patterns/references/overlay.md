# 覆盖层和 Toast

## 意图

使用覆盖层展示临时 UI（Toast、横幅、加载器），而不影响布局。

## 核心模式

- 使用 `.overlay(alignment:)` 放置全局 UI，而无需改变底层布局。
- 保持覆盖层轻量且可关闭。
- 如果多个功能触发 toast，使用专用的 `ToastCenter`（或类似组件）管理全局状态。

## 示例：Toast 覆盖层

```swift
struct AppRootView: View {
  @State private var toast: Toast?

  var body: some View {
    content
      .overlay(alignment: .top) {
        if let toast {
          ToastView(toast: toast)
            .transition(.move(edge: .top).combined(with: .opacity))
            .onAppear {
              DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
                withAnimation { self.toast = nil }
              }
            }
        }
      }
  }
}
```

## 要保留的设计选择

- 优先使用覆盖层展示临时 UI，而非将其嵌入布局堆栈中。
- 使用过渡效果和短时自动消失计时器。
- 将覆盖层对齐到明确的边缘（`.top` 或 `.bottom`）。

## 陷阱

- 除非明确需要，避免使用阻止所有交互的覆盖层。
- 不要堆叠多个覆盖层；使用队列或替换当前 toast。
