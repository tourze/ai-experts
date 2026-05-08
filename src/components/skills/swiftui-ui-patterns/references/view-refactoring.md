# 视图重构参考

来源：合并自旧 swiftui-view-refactor 流程。

## 推荐的成员顺序

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

顺序口诀：环境依赖 → `let` → `@State` → 非视图计算属性 → `init` → `body` → 子视图 / helper。

## 拆分大 `body`

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

## Observation 根视图持有

```swift
@State private var viewModel: SearchViewModel
```

根视图用 `@State` 持有 `@Observable` view model，下游只接收必要输入。

## 反模式

### FAIL: 可选 VM + bootstrapIfNeeded

```swift
struct DetailView: View {
    @State private var viewModel: DetailViewModel?
    var body: some View {
        Group { if let vm = viewModel { content(vm) } else { ProgressView() } }
            .task { if viewModel == nil { viewModel = DetailViewModel(...) } }
    }
}
```

### PASS: init 注入 + 非可选

```swift
struct DetailView: View {
    @State private var viewModel: DetailViewModel
    init(itemID: UUID, service: Service) {
        _viewModel = State(initialValue: DetailViewModel(itemID: itemID, service: service))
    }
    var body: some View { content }
}
```

### FAIL: 重构顺手改行为

```swift
// "顺便优化一下"
private var filters: some View {
    FilterSection(options: options.filter { $0.isActive })  // 改了展示范围
}
```

### PASS: 重构与变更分两个 commit

```
commit 1: refactor: extract filters/results into private views (行为不变)
commit 2: feat: default filter to active options (显式变更)
```
