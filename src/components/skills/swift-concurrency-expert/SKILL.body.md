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

## 反模式

### FAIL: 全局 @MainActor 压报错

```swift
@MainActor
final class ImageProcessor {  // 图像处理本是后台工作 → UI 卡顿
    func process(_ image: UIImage) async -> UIImage { ... }
}
```

### PASS: 按职责分隔离域

```swift
actor ImageProcessor {
    func process(_ image: UIImage) -> UIImage { ... }
}
@MainActor final class ImageViewModel {
    let processor = ImageProcessor()
    func load(_ image: UIImage) async {
        let result = await processor.process(image)
        self.displayImage = result
    }
}
```

### FAIL: @unchecked Sendable 糊过

```swift
final class Cache: @unchecked Sendable {
    var storage: [String: Data] = [:]  // 真实数据竞争
}
```

### PASS: actor 保证隔离

```swift
actor Cache {
    private var storage: [String: Data] = [:]
    func get(_ key: String) -> Data? { storage[key] }
}
```
