# SwiftUI 并发之旅（摘要）

背景：面向 SwiftUI 的并发概述，涵盖 actor 隔离、Sendable 闭包以及 SwiftUI 如何将工作移出主线程。

## SwiftUI 中的主 actor 默认

- `View` 默认是 `@MainActor` 隔离的；成员和 `body` 继承隔离。
- Swift 6.2 可以为模块中的所有类型推断 `@MainActor`（新语言模式）。
- 此默认简化了 UI 代码，并与 UIKit/AppKit 的 `@MainActor` API 对齐。

## SwiftUI 在何处将代码移出主线程

- SwiftUI 可能会在后台线程上评估某些视图逻辑以提升性能。
- 示例：`Shape` 路径生成、`Layout` 方法、`visualEffect` 闭包和 `onGeometryChange` 闭包。
- 这些 API 通常需要 `Sendable` 闭包以反映其运行时语义。

## Sendable 闭包和数据竞争安全

- 从 `Sendable` 闭包访问 `@MainActor` 状态是不安全的，会被编译器标记。
- 优先在闭包捕获列表中捕获值副本（例如，复制一个 `Bool`）。
- 避免仅为了读取单个属性而将 `self` 传入可发送闭包。

## 使用 SwiftUI 组织异步工作

- SwiftUI 操作回调是同步的，以便 UI 更新（如加载状态）可以即时生效。
- 使用 `Task` 桥接到异步上下文；保持异步主体尽量精简。
- 将状态作为边界：异步工作更新模型/状态；UI 同步响应。

## 性能驱动的并发

- 将昂贵的工作从主 actor 卸载以避免卡顿。
- 将对时间敏感的 UI 逻辑（动画、手势响应）保持同步。
- 将 UI 代码与长时间运行的异步工作分离，以提高响应性和可测试性。
