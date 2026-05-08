# Sheets

## 意图

使用集中式 sheet 路由模式，使任何视图都可以呈现模态框，而无需逐层传递属性。这使 sheet 状态集中在一处，并随应用增长而扩展。

## 核心架构

- 定义一个 `SheetDestination` 枚举，描述每个模态框，并实现 `Identifiable`。
- 将当前 sheet 存储在路由器对象中（`presentedSheet: SheetDestination?`）。
- 创建一个类似 `withSheetDestinations(...)` 的视图修饰符，将枚举映射到具体的 sheet 视图。
- 将路由器注入环境，使子视图可以直接设置 `presentedSheet`。

## 示例：SheetDestination 枚举

```swift
enum SheetDestination: Identifiable, Hashable {
  case composer
  case editProfile
  case settings
  case report(itemID: String)

  var id: String {
    switch self {
    case .composer, .editProfile:
      // 使用相同的 id 确保一次只有一个编辑器类 sheet 处于活动状态。
      return "editor"
    case .settings:
      return "settings"
    case .report:
      return "report"
    }
  }
}
```

## 示例：withSheetDestinations 修饰符

```swift
extension View {
  func withSheetDestinations(
    sheet: Binding<SheetDestination?>
  ) -> some View {
    sheet(item: sheet) { destination in
      Group {
        switch destination {
        case .composer:
          ComposerView()
        case .editProfile:
          EditProfileView()
        case .settings:
          SettingsView()
        case .report(let itemID):
          ReportView(itemID: itemID)
        }
      }
    }
  }
}
```

## 示例：从子视图展示

```swift
struct StatusRow: View {
  @Environment(RouterPath.self) private var router

  var body: some View {
    Button("Report") {
      router.presentedSheet = .report(itemID: "123")
    }
  }
}
```

## 必需的连接

为了使子视图工作，父视图必须：
- 拥有路由器实例，
- 附加 `withSheetDestinations(sheet: $router.presentedSheet)`（或等效的 `sheet(item:)` 处理器），以及
- 在 sheet 修饰符之后用 `.environment(router)` 注入，以便模态内容继承它。

这使得子视图对 `router.presentedSheet` 的赋值能够驱动根视图的展示。

## 示例：需要自己导航的 sheets

将 sheet 内容包裹在 `NavigationStack` 中，以便在模态框内推送。

```swift
struct NavigationSheet<Content: View>: View {
  var content: () -> Content

  var body: some View {
    NavigationStack {
      content()
        .toolbar { CloseToolbarItem() }
    }
  }
}
```

## 要保留的设计选择

- 集中化 sheet 路由，使功能可以呈现模态框而无需通过许多层连接绑定。
- 使用 `sheet(item:)` 确保只有一个 sheet 处于活动状态，并从枚举驱动展示。
- 当相关 sheets 互斥时（例如编辑器流程），将其归入相同的 `id` 下。
- 保持 sheet 视图轻量并由较小的视图组成；避免大型单体。
- 将路由器注入环境，使子视图可以设置 `presentedSheet` 而无需直接绑定。

## 陷阱

- 避免为同一关注点混合使用 `sheet(isPresented:)` 和 `sheet(item:)`；优先使用单一枚举。
- 不要在 `SheetDestination` 中存储重型状态；传递轻量级标识符或模型。
- 如果同一界面可能弹出多个 sheet，为它们分配不同的 `id` 值。
