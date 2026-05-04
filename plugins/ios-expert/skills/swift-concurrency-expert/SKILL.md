---
name: swift-concurrency-expert
description: 当用户需要审查或修复 Swift 6.2+ concurrency、actor isolation、Sendable、Task、MainActor 或数据竞争迁移时使用。
---

# Swift 并发

## 适用场景

- 修复 Swift 6.2+ 并发编译错误或数据竞争问题。
- 判断代码应放在 `@MainActor`、`actor`、`nonisolated` 还是普通类型上。
- 审查 `Sendable`、任务生命周期、结构化并发和 SwiftUI 并发用法。

通用并发原则（不阻塞异步上下文、限制并发、传播取消、不共享可变状态、超时所有外部调用、优雅停机）见 architecture-expert 的 concurrency-patterns skill。

## Swift 特有约束

- 先收集真实诊断信息，再决定修法；不要先加 `@unchecked Sendable` 或 `nonisolated(unsafe)` 糊过去。
- UI 类型先考虑 `@MainActor`，共享可变状态先考虑 `actor`。
- 只有在能证明线程安全时才接受 `Sendable` / `@unchecked Sendable`。
- 需要背景资料时读取 `references/swift-6-2-concurrency.md`、`references/approachable-concurrency.md`。

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
