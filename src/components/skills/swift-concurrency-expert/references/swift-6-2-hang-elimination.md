# iOS 26 / Swift 6.2 消除卡死的特性

Swift 6.2 引入了几个专门设计用于消除由 actor 跳转和执行器排队延迟引起的卡死的特性。

## 1. SE-0472: Task.immediate - 消除 Actor 跳转延迟

[SE-0472](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0472-task-start-synchronously-on-caller-context.md) 引入了 `Task.immediate`，它在调用方的上下文中同步开始执行，直到第一个挂起点。

### 问题：Task 排队到执行器导致卡死

```swift
// 创建 Task 排队到执行器 - 在 init 期间导致卡死
EntitlementManager.shared.storeKitService.setUserIDProvider { @MainActor in
    AuthSession.shared.currentUserID?.uuidString
}
```

### 解决方案：Task.immediate

```swift
// 同步执行直到第一次真正挂起
public func setUserIDProvider(_ provider: (@Sendable () async -> String?)?) {
    Task.immediate { await state.setUserIDProvider(provider) }
}
```

`Task.immediate` 同步执行直到第一次真正挂起，避免了在 init 期间导致卡死的执行器队列延迟。

---

## 2. SE-0462: Task 优先级提升 API

[SE-0462](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0462-task-priority-escalation-apis.md) 提供了检测和手动传播优先级提升的 API。

### 交易监听器示例

```swift
func startTransactionListener() {
    transactionUpdateTask?.cancel()
    transactionUpdateTask = Task(priority: .utility) { [weak self] in
        guard let self else { return }

        // 使用优先级提升处理器在需要时提升
        await withTaskPriorityEscalationHandler {
            // 优先级提升时调用处理器
            logger.debug("Transaction listener priority escalated")
        } operation: {
            for await result in StoreKit.Transaction.updates {
                await self.handle(result)
            }
        }
    }
}
```

### SSE 流示例

```swift
public func stream() -> AsyncThrowingStream<SSEEvent, Error> {
    AsyncThrowingStream { continuation in
        // 使用 Task.immediate 加速启动
        let task = Task.immediate(priority: .utility) { [weak self] in
            guard let self else { return }

            await withTaskPriorityEscalationHandler {
                // 消费者等待时提升优先级
                logger.debug("SSE stream priority escalated")
            } operation: {
                // ... 现有的流逻辑
            }
        }
        // ...
    }
}
```

---

## 3. SE-0466: 默认主 Actor 隔离

[默认主 Actor 隔离](https://www.donnywals.com/setting-default-actor-isolation-in-xcode-26/) 在带有 Xcode 26 的 Swift 6.2 中允许在项目级别设置默认的主 actor 隔离。

### 在构建设置中启用

```
SWIFT_DEFAULT_ACTOR_ISOLATION = MainActor
```

### 优势

- 所有代码默认在主 actor 上运行（单线程）
- 使用显式的 `@concurrent` 或 `nonisolated` 选择加入并发
- 消除意外的 actor 跳转
- 使卡死变得明显——只有在你明确离开主 actor 时才会发生

### 显式选择加入并发

```swift
// 后台工作需要显式注解
@concurrent
func loadProductsInBackground() async throws -> [Product] {
    try await Product.products(for: productIDs)
}
```

---

## 4. SE-0469: 命名任务用于调试

[命名任务](https://www.hackingwithswift.com/articles/277/whats-new-in-swift-6-2) 允许为任务命名——对于在 Instruments 中调试卡死至关重要。

### 更新所有 Task 创建

```swift
// 在 StoreKitService.swift 中
transactionUpdateTask = Task(name: "StoreKit.TransactionListener", priority: .utility) {
    // ...
}

// 在 SSEReconnectingClient.swift 中
Task.detached(name: "SSE.Stream.\(endpoint)", priority: .utility) {
    // ...
}

// 在 ProfileViewModel 中
Task(name: "Profile.LoadAllData") {
    // ...
}
```

**调试优势：** 任务名称出现在 Instruments 跟踪中，使得识别哪个任务导致卡死变得简单。

---

## 5. nonisolated(nonsending) - 阻止 Executor 跳转

Swift 6.2 的[平易近人的并发](https://www.avanderlee.com/concurrency/approachable-concurrency-in-swift-6-2-a-clear-guide/) 使 `nonisolated` 异步函数继承调用方的 actor 上下文，而不是跳转到全局执行器。

### 应用于不需要跳转的仓库方法

```swift
// 停留在调用方的 actor 上，无跳转
nonisolated(nonsending)
public func fetchEquipment(policy: CachePolicy) async throws -> [Equipment] {
    // 实现
}
```

### 当确实需要并行执行时使用 @concurrent

```swift
// 显式在主 actor 之外运行
@concurrent
public func fetchEquipmentFromServer() async throws -> [Equipment] {
    // 实现
}
```

---

## 6. TaskGroup 节流模式

虽然[有限并行 TaskGroup](https://forums.swift.org/t/pitch-limited-parallelism-taskgroup/80404) 仍在提议阶段，请使用此模式：

```swift
@MainActor
func loadAllData() async {
    // 节流到 3 个并发获取
    await withTaskGroup(of: Void.self) { group in
        var pending = 0
        let maxConcurrent = 3

        for operation in operations {
            if pending >= maxConcurrent {
                await group.next()
                pending -= 1
            }

            group.addTask(name: "Profile.\(operation.name)") {
                await operation.execute()
            }
            pending += 1
        }

        await group.waitForAll()
    }
}
```

---

## 使用 Swift 6.2 重构后的完整 App.init()

```swift
@main
struct MyApp: App {
    // ... 现有属性

    init() {
        // 同步，无 actor 跳转
        APIClientBootstrap.configureIfNeeded()
        _container = StateObject(wrappedValue: AppContainer())

        // 同步初始化服务
        _biometricColorService = State(initialValue: BiometricColorService(
            healthRepository: RepositoryContainer.shared.health,
            hasFitnessAccess: EntitlementManager.shared.entitlements.canAccessWorkouts
        ))

        // 已移除：setUserIDProvider 调用 - 移至 .task
        // 已移除：SentrySDK.start - 移至后台任务

        SyncStatusViewModel.shared = SyncStatusViewModel(
            statusProvider: BackgroundSyncService.shared,
            syncService: BackgroundSyncService.shared
        )
    }

    var body: some Scene {
        WindowGroup {
            mainView
                .task(priority: .userInitiated, name: "App.PostInit") {
                    // 在 init 完成后配置 StoreKit
                    // Task.immediate 确保无排队延迟
                    Task.immediate {
                        EntitlementManager.shared.storeKitService.setUserIDProvider {
                            await AuthSession.shared.currentUserID?.uuidString
                        }
                    }
                }
                .task(priority: .background, name: "App.Sentry") {
                    // Sentry 初始化在后台 - 不阻塞启动
                    configureSentry()
                }
                .task { await authVM.handle(.checkAuthState) }
        }
    }
}
```

---

## 总结：Swift 6.2 打造坚如磐石的并发的特性

| 特性 | SE 提案 | 用例 |
|------|---------|------|
| `Task.immediate` | [SE-0472](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0472-task-start-synchronously-on-caller-context.md) | 消除 init 中的执行器队列延迟 |
| 优先级提升 | [SE-0462](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0462-task-priority-escalation-apis.md) | 防止执行器饥饿 |
| 命名任务 | [SE-0469](https://www.hackingwithswift.com/articles/277/whats-new-in-swift-6-2) | 在 Instruments 中调试卡死 |
| 默认主 Actor | [Xcode 26](https://www.donnywals.com/setting-default-actor-isolation-in-xcode-26/) | 默认单线程 |
| `@concurrent` | Swift 6.2 | 显式选择加入并行 |
| `nonisolated(nonsending)` | Swift 6.2 | 防止不必要的执行器跳转 |

这些特性使并发变成**显式和有意图的**，而非意外——这是消除卡死的关键。

---

## 来源

- [What's new in Swift 6.2](https://www.hackingwithswift.com/articles/277/whats-new-in-swift-6-2)
- [Approachable Concurrency in Swift 6.2](https://www.avanderlee.com/concurrency/approachable-concurrency-in-swift-6-2-a-clear-guide/)
- [Setting Default Actor Isolation in Xcode 26](https://www.donnywals.com/setting-default-actor-isolation-in-xcode-26/)
- [SE-0472: Task Start Synchronously](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0472-task-start-synchronously-on-caller-context.md)
- [SE-0462: Task Priority Escalation](https://github.com/swiftlang/swift-evolution/blob/main/proposals/0462-task-priority-escalation-apis.md)
