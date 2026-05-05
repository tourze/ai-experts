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
