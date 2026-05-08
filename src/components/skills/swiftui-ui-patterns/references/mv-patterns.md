# MV 模式参考

来源由用户提供："SwiftUI in 2025: Forget MVVM"（Thomas Ricouard）。

在决定是否引入视图模型时使用此参考。

关键点：
- 默认使用 MV：视图是轻量级状态表达式和编排点。
- 优先使用 `@State`、`@Environment`、`@Query`、`task` 和 `onChange` 而非视图模型。
- 通过 `@Environment` 注入服务和共享模型；将逻辑保留在服务/模型中。
- 将大型视图拆分为较小的视图，而不是将逻辑移入视图模型。
- 避免重复 SwiftUI/SwiftData 机制的手动数据获取。
- 测试模型/服务和业务逻辑；视图应保持简单和声明式。

# SwiftUI in 2025: Forget MVVM

*让我告诉你为什么*

**Thomas Ricouard**
阅读时间约 10 分钟 · 2025 年 6 月 2 日

---

现在是 2025 年，我仍然被问到同样的问题：

> "你的 ViewModel 在哪里？"

每当我分享这个观点或来自我的开源项目（如我的 BlueSky 客户端 **IcySky**，甚至 Medium iOS 应用）的代码时，开发者们都很惊讶于看到没有 ViewModel 的干净、简单的视图。

让我说清楚：

你在 SwiftUI 中不需要 ViewModels。
你从来都不需要。
你永远不会需要。

---

## MVVM 陷阱

当 SwiftUI 在 2019 年推出时，许多开发者带着他们的 UIKit 包袱过来。我们太习惯 *Massive View Controller* 的问题了，于是立即将 MVVM 视为救星。

但 SwiftUI 不是 UIKit。

它从一开始就采用了不同的设计理念，在多个 WWDC 讲座中都有强调：

- *Data Flow Through SwiftUI (WWDC19)*
- *Data Essentials in SwiftUI (WWDC20)*
- *Discover Observation in SwiftUI (WWDC23)*

这些讲座几乎不提及 ViewModel。

为什么？因为 ViewModel 与 SwiftUI 的数据流模型几乎是格格不入的。

SwiftUI 视图是**结构体**，而不是类。它们是轻量级、可丢弃且经常重新创建的。添加 ViewModel 意味着与框架的核心设计对抗。

---

## 视图作为纯状态表达式

在我最新的 IcySky 应用中，每个视图都遵循我多年来一直倡导的相同模式。

```swift
struct FeedView: View {

    @Environment(BlueSkyClient.self) private var client
    @Environment(AppTheme.self) private var theme

    enum ViewState {
        case loading
        case error(String)
        case loaded([Post])
    }

    @State private var viewState: ViewState = .loading
    @State private var isRefreshing = false

    var body: some View {
        NavigationStack {
            List {
                switch viewState {
                case .loading:
                    ProgressView("Loading feed...")
                        .frame(maxWidth: .infinity)
                        .listRowSeparator(.hidden)

                case .error(let message):
                    ErrorStateView(
                        message: message,
                        retryAction: { await loadFeed() }
                    )
                    .listRowSeparator(.hidden)

                case .loaded(let posts):
                    ForEach(posts) { post in
                        PostRowView(post: post)
                            .listRowInsets(.init())
                    }
                }
            }
            .listStyle(.plain)
            .refreshable { await refreshFeed() }
            .task { await loadFeed() }
        }
    }
}
```

状态在视图内部定义，使用枚举。

没有 ViewModel。
没有间接层。
视图是状态的直接表达。

## Environment 的魔力

SwiftUI 没有通过 ViewModel 进行依赖注入，而是给了我们 `@Environment`。

```swift
@Environment(BlueSkyClient.self) private var client

private func loadFeed() async {
    do {
        let posts = try await client.getFeed()
        viewState = .loaded(posts)
    } catch {
        viewState = .error(error.localizedDescription)
    }
}
```

你的服务存在于环境中，可以独立测试，并封装了复杂性。

视图编排 UI 流程 — 仅此而已。

现实世界的复杂性
"这只适用于简单的应用。"

不。

IcySky 处理认证、复杂 Feed、导航和用户交互 — 都没有 ViewModel。

Medium iOS 应用（数百万用户）现在大部分是 SwiftUI，使用的 ViewModel 非常少，大多数是从 2019 年遗留的。

对于新功能，我们将服务注入环境，并用本地状态构建轻量级视图。

## 使用 `.task(id:)` 和 `.onChange()`

SwiftUI 的修饰符充当小型状态缩减器。

```swift
.task(id: searchText) {
    guard !searchText.isEmpty else { return }
    await searchFeed(query: searchText)
}
.onChange(of: isInSearch, initial: false) {
    guard !isInSearch else { return }
    Task { await fetchSuggestedFeed() }
}
```

可读。本地。显式。

## 应用级环境设置

```swift
@main
struct IcySkyApp: App {

    @Environment(\.scenePhase) var scenePhase

    @State var client: BSkyClient?
    @State var auth: Auth = .init()
    @State var currentUser: CurrentUser?
    @State var router: AppRouter = .init(initialTab: .feed)

    var body: some Scene {
        WindowGroup {
            TabView(selection: $router.selectedTab) {
                if client != nil && currentUser != nil {
                    ForEach(AppTab.allCases) { tab in
                        AppTabRootView(tab: tab)
                            .tag(tab)
                            .toolbarVisibility(.hidden, for: .tabBar)
                    }
                } else {
                    ProgressView()
                        .containerRelativeFrame([.horizontal, .vertical])
                }
            }
            .environment(client)
            .environment(currentUser)
            .environment(auth)
            .environment(router)
        }
    }
}
```

所有依赖一次性注入并随处可用。

## SwiftData：完美示例
SwiftData 被设计为直接在视图中使用。

```swift
struct BookListView: View {

    @Query private var books: [Book]
    @Environment(\.modelContext) private var modelContext

    var body: some View {
        List {
            ForEach(books) { book in
                BookRowView(book: book)
                    .swipeActions {
                        Button("Delete", role: .destructive) {
                            modelContext.delete(book)
                        }
                    }
            }
        }
    }
}
```

现在与强制使用 ViewModel 的版本对比：

```swift
@Observable
class BookListViewModel {
    private var modelContext: ModelContext
    var books: [Book] = []

    init(modelContext: ModelContext) {
        self.modelContext = modelContext
        fetchBooks()
    }

    func fetchBooks() {
        let descriptor = FetchDescriptor<Book>()
        books = try! modelContext.fetch(descriptor)
    }
}
```

手动获取。手动刷新。到处都是样板代码。

你在对抗框架。

## 测试的现实情况
测试 SwiftUI 视图提供的价值很小。

相反：

* 对服务和业务逻辑进行单元测试

* 测试模型和转换

* 使用 SwiftUI Preview 进行视觉回归测试

* 使用 UI 自动化进行端到端测试

* 如果需要，使用 `ViewInspector` 进行视图内省。

## 2025 年的现实

SwiftUI 已经成熟：

* `@Observable`

* 更好的 Environment

* 改进的异步和任务生命周期

* 几乎所有你需要的东西都存在于视图内部。

当 Apple 允许我们在视图外部访问 Environment 时，我会重新考虑 ViewModel。

在此之前，原生 SwiftUI 就是权威。

## 为什么这很重要

每个 ViewModel 都会增加：

* 更多复杂性

* 更多需要同步的对象

* 更多间接层

* 更多认知负担

SwiftUI 给你：

* `@State`

* `@Environment`

* `@Observable`

* Binding

使用它们。相信这个框架。

## 总结
在 2025 年，没有任何借口用不必要的 ViewModel 来混乱 SwiftUI 应用。

让视图成为状态的纯表达。

将复杂性集中在它该在的地方：服务和业务逻辑。

再见 MVVM
万岁 View

Happy coding
