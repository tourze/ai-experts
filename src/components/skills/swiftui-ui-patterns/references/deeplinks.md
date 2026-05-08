# 深度链接与导航

## 意图

在必要时降级到系统处理的情况下，将外部 URL 路由到应用内目标。

## 核心模式

- 在路由器中集中处理 URL（`handle(url:)`、`handleDeepLink(url:)`）。
- 注入一个委托给路由器的 `OpenURLAction` 处理器。
- 使用 `.onOpenURL` 处理应用 scheme 链接，必要时转换为 Web URL。
- 让路由器决定是导航还是外部打开。

## 示例：路由器入口点

```swift
@MainActor
final class RouterPath {
  var path: [Route] = []
  var urlHandler: ((URL) -> OpenURLAction.Result)?

  func handle(url: URL) -> OpenURLAction.Result {
    if isInternal(url) {
      navigate(to: .status(id: url.lastPathComponent))
      return .handled
    }
    return urlHandler?(url) ?? .systemAction
  }

  func handleDeepLink(url: URL) -> OpenURLAction.Result {
    // 解析联邦 URL，然后导航。
    navigate(to: .status(id: url.lastPathComponent))
    return .handled
  }
}
```

## 示例：附加到根视图

```swift
extension View {
  func withLinkRouter(_ router: RouterPath) -> some View {
    self
      .environment(
        \.openURL,
        OpenURLAction { url in
          router.handle(url: url)
        }
      )
      .onOpenURL { url in
        router.handleDeepLink(url: url)
      }
  }
}
```

## 要保留的设计选择

- 将 URL 解析和决策逻辑保留在路由器内部。
- 避免在多个地方处理深度链接；一个入口点就足够了。
- 始终提供 `OpenURLAction` 或 `UIApplication.shared.open` 的降级方案。

## 陷阱

- 不要假设 URL 是内部的；先验证。
- 避免在解析远程链接时阻塞 UI；使用 `Task`。
