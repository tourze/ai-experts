# 顶部栏覆盖（iOS 26+ 及降级方案）

## 意图

提供位于滚动内容上方的自定义顶部选择器或胶囊行，在 iOS 26 上使用 `safeAreaBar(.top)`，在较早版本上使用兼容降级方案。

## iOS 26+ 方法

使用 `safeAreaBar(edge: .top)` 将视图附加到安全区域栏。

```swift
if #available(iOS 26.0, *) {
  content
    .safeAreaBar(edge: .top) {
      TopSelectorView()
        .padding(.horizontal, .layoutPadding)
    }
}
```

## 早期 iOS 的降级方案

使用 `.safeAreaInset(edge: .top)` 并隐藏工具栏背景以避免双层叠加。

```swift
content
  .toolbarBackground(.hidden, for: .navigationBar)
  .safeAreaInset(edge: .top, spacing: 0) {
    VStack(spacing: 0) {
      TopSelectorView()
        .padding(.vertical, 8)
        .padding(.horizontal, .layoutPadding)
        .background(Color.primary.opacity(0.06))
        .background(Material.ultraThin)
      Divider()
    }
  }
```

## 要保留的设计选择

- 在可用时使用 `safeAreaBar`；它与导航栏的集成更好。
- 在降级方案中使用微妙的背景加分隔线，保持与内容的分离感。
- 保持选择器高度紧凑，避免将内容推得太远。

## 陷阱

- 不要堆叠多个顶部插边；可能产生额外的内边距。
- 避免使用厚重的、与导航栏冲突的不透明背景。
