---
name: swift-concurrency-expert
description: 当用户需要审查或修复 Swift 6.2+ concurrency、actor isolation、Sendable、Task、MainActor 或数据竞争迁移时使用。
---

# Swift 并发审查

## 适用场景

- 用户要求修复 Swift 6.2+ 并发编译错误或数据竞争问题。
- 需要判断某段代码应放在 `@MainActor`、`actor`、`nonisolated` 还是普通类型上。
- 需要审查 `Sendable`、任务生命周期、结构化并发和 SwiftUI 并发用法。

## 核心约束

- 先收集真实诊断信息和当前 actor 上下文，再决定修法；不要先加 `@unchecked Sendable` 或 `nonisolated(unsafe)` 糊过去。
- 优先做最小安全修复：UI 类型先考虑 `@MainActor`，共享可变状态先考虑 `actor`。
- 只有在能证明线程安全时才接受 `Sendable` / `@unchecked Sendable`。
- 需要背景资料时读取 `references/swift-6-2-concurrency.md`、`references/approachable-concurrency.md`、`references/swiftui-concurrency-tour-wwdc.md`。

## 代码模式

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

    func insert(_ data: Data, for url: URL) {
        storage[url] = data
    }
}
```

### 结构化并发优先

```swift
Task {
    await viewModel.load()
}
```

## 检查清单

- 记录原始编译报错、冲突符号、调用方 actor 上下文和 Swift 版本设置。
- 判断该代码属于 UI、共享状态还是纯后台工作，然后再选 `@MainActor` / `actor` / 普通 async。
- 查找 `Task.detached`、`@unchecked Sendable`、`nonisolated(unsafe)` 这类高风险逃逸点。
- 如果是 SwiftUI 视图抖动或卡顿伴随并发问题，联动 `swiftui-performance-audit` 一起看。
- 交叉引用：性能与重渲染问题看 `swiftui-performance-audit`；视图层重构看 `swiftui-view-refactor`。

## 反模式

### FAIL: 全局 @MainActor 压报错

```swift
@MainActor
final class ImageProcessor {  // 图像处理本是后台工作
    func process(_ image: UIImage) async -> UIImage { ... } // 被迫主线程跑 CPU 密集 → UI 卡顿
}
```

### PASS: 按职责分隔离域

```swift
actor ImageProcessor {  // 后台工作用 actor
    func process(_ image: UIImage) -> UIImage { ... }
}
@MainActor final class ImageViewModel {
    let processor = ImageProcessor()
    func load(_ image: UIImage) async {
        let result = await processor.process(image)
        self.displayImage = result  // 主线程更新 UI
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
