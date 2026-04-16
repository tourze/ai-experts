---
name: swiftui-view-refactor
description: 当用户要清理 SwiftUI 视图结构、拆分大视图或收敛依赖注入与 Observation 用法时使用。
---

# SwiftUI 视图重构

## 适用场景

- 需要整理 SwiftUI 文件顺序、依赖注入方式和 `@Observable` 使用方式。
- 需要把臃肿的 `body` 拆成更清晰的子视图或 helper。
- 需要把“可选 view model + bootstrapIfNeeded”这一类不稳定结构改成可维护模式。

## 核心约束

- 先保证行为不变，再整理结构；重构不是顺手改交互。
- 默认走 MV：视图负责状态表达和轻量编排，业务逻辑仍留在模型 / 服务层。
- 如果 view model 已存在，优先让它变成非可选并在 `init` 中完成注入。
- 需要理念展开时读取 `references/mv-patterns.md`，不要另造一套术语。

## 代码模式

### 推荐的成员顺序

```swift
struct DetailView: View {
    @Environment(Service.self) private var service

    let itemID: UUID
    @State private var viewModel: DetailViewModel

    init(itemID: UUID, service: Service) {
        self.itemID = itemID
        _viewModel = State(initialValue: DetailViewModel(itemID: itemID, service: service))
    }

    var body: some View {
        content
    }

    private var content: some View {
        Text(viewModel.title)
    }
}
```

### 把大 `body` 拆成小块

```swift
var body: some View {
    List {
        header
        filters
        results
    }
}

private var header: some View { HeaderSection(title: title) }
private var filters: some View { FilterSection(options: options) }
private var results: some View { ResultsSection(items: items) }
```

### Observation 根视图持有

```swift
@State private var viewModel: SearchViewModel
```

## 检查清单

- 文件顺序是否统一为：环境依赖 → `let` → `@State` → 非视图计算属性 → `init` → `body` → 子视图 / helper。
- 大型 `body` 是否拆成可命名的子区域，而不是继续堆条件分支。
- 是否移除了不必要的可选 view model、`bootstrapIfNeeded` 和重复包装。
- 根视图是否正确持有 `@Observable`，下游只接收必要输入。
- 交叉引用：组件模式选择看 `swiftui-ui-patterns`；并发边界调整看 `swift-concurrency-expert`。

## 反模式

- 一边重构结构，一边顺手改业务逻辑和页面行为。
- 用可选 view model + 运行时引导掩盖初始化时序问题。
- 把每个 computed subview 都强行抽成新文件，导致上下文被切碎。
- 把服务、状态和 UI 全塞进单个视图文件。
