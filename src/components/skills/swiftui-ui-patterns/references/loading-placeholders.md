# 加载与占位符

当视图需要一致的加载状态（骨架屏、脱敏、空状态）而不阻塞交互时使用。

## 推荐模式

- **脱敏占位符**用于列表/详情内容，在加载时保留布局。
- **ContentUnavailableView**用于加载完成后的空或错误状态。
- **ProgressView**仅用于短时、全局操作（在内容密集的界面中谨慎使用）。

## 推荐方法

1. 保留实际布局，渲染占位数据，然后应用 `.redacted(reason: .placeholder)`。
2. 对于列表，显示固定数量的占位行（避免无限旋转器）。
3. 当加载完成但数据为空时切换到 `ContentUnavailableView`。

## 陷阱

- 不要在脱敏期间动画化布局变化；保持框架稳定。
- 避免嵌套多个旋转器；每个 Section 使用一个加载指示器。
- 保持占位数量少（3-6），以减少低端设备上的卡顿。

## 最小化用法

```swift
VStack {
  if isLoading {
    ForEach(0..<3, id: \.self) { _ in
      RowView(model: .placeholder())
    }
    .redacted(reason: .placeholder)
  } else if items.isEmpty {
    ContentUnavailableView("No items", systemImage: "tray")
  } else {
    ForEach(items) { item in RowView(model: item) }
  }
}
```
