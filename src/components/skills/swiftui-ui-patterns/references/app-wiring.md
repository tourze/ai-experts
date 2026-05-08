# App 连接与依赖图

## 意图

展示如何连接应用外壳（TabView + NavigationStack + sheets）并在一个位置安装全局依赖图（环境对象、服务、流客户端、SwiftData ModelContainer）。

## 推荐结构

1) 根视图设置标签页、每标签路由器和 sheets。
2) 一个专用的视图修饰符安装全局依赖和生命周期任务（认证状态、流观察者、推送令牌、数据容器）。
3) 功能视图仅从环境中获取所需内容；功能特定状态保持本地。

## 根外壳示例（通用）

```swift
@MainActor
struct AppView: View {
  @State private var selectedTab: AppTab = .home
  @State private var tabRouter = TabRouter()

  var body: some View {
    TabView(selection: $selectedTab) {
      ForEach(AppTab.allCases) { tab in
        let router = tabRouter.router(for: tab)
        NavigationStack(path: tabRouter.binding(for: tab)) {
          tab.makeContentView()
        }
        .withSheetDestinations(sheet: Binding(
          get: { router.presentedSheet },
          set: { router.presentedSheet = $0 }
        ))
        .environment(router)
        .tabItem { tab.label }
        .tag(tab)
      }
    }
    .withAppDependencyGraph()
  }
}
```

最小化 `AppTab` 示例：

```swift
@MainActor
enum AppTab: Identifiable, Hashable, CaseIterable {
  case home, notifications, settings
  var id: String { String(describing: self) }

  @ViewBuilder
  func makeContentView() -> some View {
    switch self {
    case .home: HomeView()
    case .notifications: NotificationsView()
    case .settings: SettingsView()
    }
  }

  @ViewBuilder
  var label: some View {
    switch self {
    case .home: Label("Home", systemImage: "house")
    case .notifications: Label("Notifications", systemImage: "bell")
    case .settings: Label("Settings", systemImage: "gear")
    }
  }
}
```

路由器骨架：

```swift
@MainActor
@Observable
final class RouterPath {
  var path: [Route] = []
  var presentedSheet: SheetDestination?
}

enum Route: Hashable {
  case detail(id: String)
}
```

## 依赖图修饰符（通用）

使用单一修饰符来安装环境对象并在活动账户/客户端变化时处理生命周期钩子。这样可以保持连接的一致性，并避免在调用点遗漏依赖。

```swift
extension View {
  func withAppDependencyGraph(
    accountManager: AccountManager = .shared,
    currentAccount: CurrentAccount = .shared,
    currentInstance: CurrentInstance = .shared,
    userPreferences: UserPreferences = .shared,
    theme: Theme = .shared,
    watcher: StreamWatcher = .shared,
    pushNotifications: PushNotificationsService = .shared,
    intentService: AppIntentService = .shared,
    quickLook: QuickLook = .shared,
    toastCenter: ToastCenter = .shared,
    namespace: Namespace.ID? = nil,
    isSupporter: Bool = false
  ) -> some View {
    environment(accountManager)
      .environment(accountManager.currentClient)
      .environment(quickLook)
      .environment(currentAccount)
      .environment(currentInstance)
      .environment(userPreferences)
      .environment(theme)
      .environment(watcher)
      .environment(pushNotifications)
      .environment(intentService)
      .environment(toastCenter)
      .environment(\.isSupporter, isSupporter)
      .task(id: accountManager.currentClient.id) {
        let client = accountManager.currentClient
        if let namespace { quickLook.namespace = namespace }
        currentAccount.setClient(client: client)
        currentInstance.setClient(client: client)
        userPreferences.setClient(client: client)
        await currentInstance.fetchCurrentInstance()
        watcher.setClient(client: client, instanceStreamingURL: currentInstance.instance?.streamingURL)
        if client.isAuth {
          watcher.watch(streams: [.user, .direct])
        } else {
          watcher.stopWatching()
        }
      }
      .task(id: accountManager.pushAccounts.map(\.token)) {
        pushNotifications.tokens = accountManager.pushAccounts.map(\.token)
      }
  }
}
```

注意：
- `.task(id:)` 钩子响应账户/客户端变化，重新注入服务和观察者状态。
- 保持修饰符专注于全局连接；功能特定状态保留在功能内部。
- 根据项目调整类型（AccountManager、StreamWatcher 等）。

## SwiftData / ModelContainer

在根视图安装 `ModelContainer`，以便所有功能视图共享同一存储。只包含需要持久化的模型。

```swift
extension View {
  func withModelContainer() -> some View {
    modelContainer(for: [Draft.self, LocalTimeline.self, TagGroup.self])
  }
}
```

原因：单一容器避免每个 sheet 或标签页出现重复的存储，并保持数据一致性。

## Sheet 路由（枚举驱动）

使用小型枚举和辅助修饰符集中管理 sheets。

```swift
enum SheetDestination: Identifiable {
  case composer
  case settings
  var id: String { String(describing: self) }
}

extension View {
  func withSheetDestinations(sheet: Binding<SheetDestination?>) -> some View {
    sheet(item: sheet) { destination in
      switch destination {
      case .composer:
        ComposerView().withEnvironments()
      case .settings:
        SettingsView().withEnvironments()
      }
    }
  }
}
```

原因：枚举驱动的 sheets 使展示集中化且可测试；添加新 sheet 只需添加一个枚举 case 和一个 switch 分支。

## 何时使用

- 具有多个包/模块且共享环境对象和服务的应用。
- 需要响应账户/客户端变化并安全地重新连接流/推送的应用。
- 任何希望保持一致的 TabView + NavigationStack + sheet 连接，而不重复环境设置的应用。

## 注意事项

- 保持依赖修饰符精简；不要在其中放置功能状态或重量级逻辑。
- 确保 `.task(id:)` 的工作量轻量或可适当取消；长时间运行的工作应归属于服务。
- 如果存在未认证客户端，请限制流/观察调用以避免重复连接。
