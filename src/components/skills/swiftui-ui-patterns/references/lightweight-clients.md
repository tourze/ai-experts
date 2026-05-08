# 轻量级客户端（闭包式）

使用此模式保持网络或服务依赖简单且可测试，无需引入完整的视图模型或重量级 DI 框架。它非常适合 SwiftUI 应用，在需要小型、可组合的 API 接口且可在预览/测试中替换的场景下使用。

## 意图
- 提供一个由异步闭包组成的微型"客户端"类型。
- 将业务逻辑保留在 store 或功能层中，而非视图。
- 便于在预览/测试中进行桩替换。

## 最小结构
```swift
struct SomeClient {
    var fetchItems: (_ limit: Int) async throws -> [Item]
    var search: (_ query: String, _ limit: Int) async throws -> [Item]
}

extension SomeClient {
    static func live(baseURL: URL = URL(string: "https://example.com")!) -> SomeClient {
        let session = URLSession.shared
        return SomeClient(
            fetchItems: { limit in
                // 构建 URL，调用 session，解码
            },
            search: { query, limit in
                // 构建 URL，调用 session，解码
            }
        )
    }
}
```

## 使用模式
```swift
@MainActor
@Observable final class ItemsStore {
    enum LoadState { case idle, loading, loaded, failed(String) }

    var items: [Item] = []
    var state: LoadState = .idle
    private let client: SomeClient

    init(client: SomeClient) {
        self.client = client
    }

    func load(limit: Int = 20) async {
        state = .loading
        do {
            items = try await client.fetchItems(limit)
            state = .loaded
        } catch {
            state = .failed(error.localizedDescription)
        }
    }
}
```

```swift
struct ContentView: View {
    @Environment(ItemsStore.self) private var store

    var body: some View {
        List(store.items) { item in
            Text(item.title)
        }
        .task { await store.load() }
    }
}
```

```swift
@main
struct MyApp: App {
    @State private var store = ItemsStore(client: .live())

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(store)
        }
    }
}
```

## 指导原则
- 将解码和 URL 构建保留在客户端中；将状态变化保留在 store 中。
- 使 store 在 `init` 中接受客户端并保持其为私有的。
- 避免全局单例；使用 `.environment` 进行 store 注入。
- 如果需要多个变体（mock/stub），添加 `static func mock(...)`。

## 陷阱
- 不要将 UI 状态放在客户端中；将状态保持在 store 中。
- 不要在客户端闭包中捕获 `self` 或视图状态。
