## Swift 代码模式

### UI 绑定状态收敛到主线程

```swift
@MainActor
final class ProfileViewModel {
    private(set) var state: LoadState = .idle
    func load() async {
        state = .loading
        state = await fetchProfile()
    }
}
```

### 用 actor 保护共享可变状态

```swift
actor ImageCache {
    private var storage: [URL: Data] = [:]
    func value(for url: URL) -> Data? { storage[url] }
    func insert(_ data: Data, for url: URL) { storage[url] = data }
}
```

联动：`swiftui-performance-audit`（性能与重渲染）、`swiftui-ui-patterns`（视图结构）
