---
name: swiftui-performance-audit
description: 当 SwiftUI 界面出现卡顿、掉帧、高 CPU 或重渲染问题时使用。
---

# SwiftUI 性能审计

## 适用场景

- 用户反馈列表滚动卡顿、动画掉帧、界面重绘过多、CPU / 内存异常。
- 需要从代码审查切到 Instruments 指导，再回到具体修复方案。
- 需要判断是身份不稳定、状态扇出、重计算还是布局链过深导致的性能问题。

## 核心约束

- 先做代码级归因，再决定是否要求用户补 Instruments trace。
- 优先修根因：状态粒度、身份稳定性、主线程重活、图片解码与布局复杂度。
- 不要把 `equatable()`、缓存或 `.id()` 当万用药；先解释为什么会重绘。
- 参考资料只使用真实存在的本地文档：`references/optimizing-swiftui-performance-instruments.md`、`references/understanding-improving-swiftui-performance.md`、`references/understanding-hangs-in-your-app.md`、`references/demystify-swiftui-performance-wwdc23.md`。

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
