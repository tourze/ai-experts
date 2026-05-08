# 网格

## 意图

在图标选择器、媒体库和密集视觉选择场景中使用 `LazyVGrid`，其中项目按列对齐。

## 核心模式

- 使用 `.adaptive` 列实现应在不同设备尺寸间缩放的布局。
- 需要固定列数时使用多个 `.flexible` 列。
- 保持间距一致且紧凑，避免不均匀的间隔。
- 在网格单元格中需要方形缩略图时使用 `GeometryReader`。

## 示例：自适应图标网格

```swift
let columns = [GridItem(.adaptive(minimum: 120, maximum: 1024))]

LazyVGrid(columns: columns, spacing: 6) {
  ForEach(icons) { icon in
    Button {
      select(icon)
    } label: {
      ZStack(alignment: .bottomTrailing) {
        Image(icon.previewName)
          .resizable()
          .aspectRatio(contentMode: .fit)
          .cornerRadius(6)
        if icon.isSelected {
          Image(systemName: "checkmark.seal.fill")
            .padding(4)
            .tint(.green)
        }
      }
    }
    .buttonStyle(.plain)
  }
}
```

## 示例：固定 3 列媒体网格

```swift
LazyVGrid(
  columns: [
    .init(.flexible(minimum: 100), spacing: 4),
    .init(.flexible(minimum: 100), spacing: 4),
    .init(.flexible(minimum: 100), spacing: 4),
  ],
  spacing: 4
) {
  ForEach(items) { item in
    GeometryReader { proxy in
      ThumbnailView(item: item)
        .frame(width: proxy.size.width, height: proxy.size.width)
    }
    .aspectRatio(1, contentMode: .fit)
  }
}
```

## 要保留的设计选择

- 对于大型集合使用 `LazyVGrid`；避免对大数据集使用非懒加载网格。
- 在需要时使用 `.contentShape(Rectangle())` 使点击区域全宽。
- 对于设置选择器和灵活布局，优先使用自适应网格。

## 陷阱

- 避免在每个网格单元格中使用重量级覆盖层；这可能代价高昂。
- 没有明确理由不要嵌套网格。
