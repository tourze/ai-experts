# 匹配过渡

## 意图

使用匹配过渡在源视图（缩略图、头像）和目标视图（sheet、详情、查看器）之间创建平滑的连续性。

## 核心模式

- 使用共享的 `Namespace` 和源视图的稳定 ID。
- 在 iOS 26+ 上使用 `matchedTransitionSource` + `navigationTransition(.zoom(...))`。
- 在视图层次内使用 `matchedGeometryEffect` 实现原地过渡。
- 在视图更新期间保持 ID 稳定（避免随机 UUID）。

## 示例：媒体预览到全屏查看器（iOS 26+）

```swift
struct MediaPreview: View {
  @Namespace private var namespace
  @State private var selected: MediaAttachment?

  var body: some View {
    ThumbnailView()
      .matchedTransitionSource(id: selected?.id ?? "", in: namespace)
      .sheet(item: $selected) { item in
        MediaViewer(item: item)
          .navigationTransition(.zoom(sourceID: item.id, in: namespace))
      }
  }
}
```

## 示例：视图内的匹配几何

```swift
struct ToggleBadge: View {
  @Namespace private var space
  @State private var isOn = false

  var body: some View {
    Button {
      withAnimation(.spring) { isOn.toggle() }
    } label: {
      Image(systemName: isOn ? "eye" : "eye.slash")
        .matchedGeometryEffect(id: "icon", in: space)
    }
  }
}
```

## 要保留的设计选择

- 跨屏过渡优先使用 `matchedTransitionSource`。
- 保持源和目标尺寸合理，避免突兀的缩放变化。
- 对状态驱动的过渡使用 `withAnimation`。

## 陷阱

- 不要使用不稳定的 ID；这会破坏过渡效果。
- 除非设计需要，避免形状不匹配（例如方形到圆形）。
