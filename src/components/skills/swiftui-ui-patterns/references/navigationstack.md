# NavigationStack

## 意图

使用此模式实现编程式导航和深度链接，特别是当每个标签页需要独立的导航历史时。核心思想是每个标签页一个 `NavigationStack`，每个都有自己的路径绑定和路由器对象。

## 核心架构

- 定义一个 `Hashable` 的路由枚举，代表所有目标。
- 创建一个轻量级路由器（或使用类似 `https://github.com/Dimillian/AppRouter` 的库），拥有 `path` 和任何 sheet 状态。
- 每个标签页拥有自己的路由器实例，并将 `NavigationStack(path:)` 绑定到它。
- 将路由器注入环境，使子视图可以编程式导航。
- 使用单个 `navigationDestination(for:)` 块（或 `withAppRouter()` 修饰符）集中化目标映射。

## 示例：带每标签页堆栈的自定义路由器

```swift
@MainActor
@Observable
final class RouterPath {
  var path: [Route] = []
  var presentedSheet: SheetDestination?

  func navigate(to route: Route) {
    path.append(route)
  }

  func reset() {
    path = []
  }
}

enum Route: Hashable {
  case account(id: String)
  case status(id: String)
}

@MainActor
struct TimelineTab: View {
  @State private var routerPath = RouterPath()

  var body: some View {
    NavigationStack(path: $routerPath.path) {
      TimelineView()
        .navigationDestination(for: Route.self) { route in
          switch route {
          case .account(let id): AccountView(id: id)
          case .status(let id): StatusView(id: id)
          }
        }
    }
    .environment(routerPath)
  }
}
```

## 示例：集中式目标映射

使用共享的视图修饰符避免在各界面间重复路由切换。

```swift
extension View {
  func withAppRouter() -> some View {
    navigationDestination(for: Route.self) { route in
      switch route {
      case .account(let id):
        AccountView(id: id)
      case .status(let id):
        StatusView(id: id)
      }
    }
  }
}
```

然后每个堆栈应用一次：

```swift
NavigationStack(path: $routerPath.path) {
  TimelineView()
    .withAppRouter()
}
```

## 示例：每标签页绑定（具有独立历史的标签页）

```swift
@MainActor
struct TabsView: View {
  @State private var timelineRouter = RouterPath()
  @State private var notificationsRouter = RouterPath()

  var body: some View {
    TabView {
      TimelineTab(router: timelineRouter)
      NotificationsTab(router: notificationsRouter)
    }
  }
}
```

## 示例：带每标签页 NavigationStack 的通用标签页

当标签页由数据构建且每个需要自己的路径而无需硬编码名称时使用。

```swift
@MainActor
struct TabsView: View {
  @State private var selectedTab: AppTab = .timeline
  @State private var tabRouter = TabRouter()

  var body: some View {
    TabView(selection: $selectedTab) {
      ForEach(AppTab.allCases) { tab in
        NavigationStack(path: tabRouter.binding(for: tab)) {
          tab.makeContentView()
        }
        .environment(tabRouter.router(for: tab))
        .tabItem { tab.label }
        .tag(tab)
      }
    }
  }
}

@MainActor
@Observable
final class TabRouter {
  private var routers: [AppTab: RouterPath] = [:]

  func router(for tab: AppTab) -> RouterPath {
    if let router = routers[tab] { return router }
    let router = RouterPath()
    routers[tab] = router
    return router
  }

  func binding(for tab: AppTab) -> Binding<[Route]> {
    let router = router(for: tab)
    return Binding(get: { router.path }, set: { router.path = $0 })
  }
}

## 要保留的设计选择

- 每个标签页一个 `NavigationStack` 以保留独立历史。
- 导航状态的单一事实源（`RouterPath` 或库路由器）。
- 使用 `navigationDestination(for:)` 将路由映射到视图。
- 在应用上下文变化时重置路径（账户切换、登出等）。
- 将路由器注入环境，使子视图无需逐层传递属性即可导航和展示 sheets。
- 如果希望在一个地方管理模态框，将 sheet 展示状态保留在路由器上。

## 陷阱

- 除非想要全局历史，否则不要在所有标签页间共享一个路径。
- 确保路由标识符稳定且是 `Hashable`。
- 避免在路径中存储视图实例；而是存储轻量级路由数据。
- 如果使用路由器对象，使其不受其他 `@Observable` 对象的影响，避免嵌套观察。
