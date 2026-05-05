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
