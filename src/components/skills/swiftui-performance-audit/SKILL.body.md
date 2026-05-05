## 代码模式

### 让 `ForEach` 身份稳定

```swift
List {
    ForEach(items, id: \.id) { item in
        Row(item: item)
    }
}
```

### 把重计算移出 `body`

```swift
struct ResultsView: View {
    let sortedItems: [Item]

    var body: some View {
        List(sortedItems) { item in
            Row(item: item)
        }
    }
}
```

### 缩小状态扇出

```swift
struct FavoriteRow: View {
    let item: Item
    let isFavorite: Bool

    var body: some View {
        Row(item: item, isFavorite: isFavorite)
    }
}
```

## 检查清单

- 检查列表和动画区域是否存在 `UUID()`、`id: \.self`、临时排序 / 过滤。
- 检查 `body`、计算属性和 `task` 中是否混入格式化、图片解码、数据库或网络副作用。
- 如果代码审查不足以定案，明确要求用户提供 SwiftUI template + Time Profiler trace。
- 修复后要求按同一交互路径复测，比较前后 CPU、掉帧和内存峰值。
- 交叉引用：并发边界问题看 `swift-concurrency-expert`；视图结构整理看 `swiftui-ui-patterns`。

## 反模式

### FAIL: body 里做重活

```swift
var body: some View {
    let formatter = DateFormatter()
    formatter.dateStyle = .long
    let sorted = items.sorted { $0.name < $1.name }
    List(sorted) { item in Text(formatter.string(from: item.date)) }
    // 每次重绘都建 formatter + 排序
}
```

### PASS: 重计算移出 body

```swift
private let formatter: DateFormatter = {
    let f = DateFormatter(); f.dateStyle = .long; return f
}()
let sortedItems: [Item]  // 上游预计算

var body: some View {
    List(sortedItems) { item in Text(formatter.string(from: item.date)) }
}
```

### FAIL: .id(UUID()) 让树每次重建

```swift
ForEach(items, id: \.self) { ... }  // String/Int 不稳定
.id(UUID())                          // 每次新 id → 整棵树销毁重建
```

### PASS: 稳定身份

```swift
ForEach(items, id: \.id) { item in Row(item: item) }
```
