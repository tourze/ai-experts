# 媒体（图片、视频、查看器）

## 意图

使用一致的模式加载图片、预览媒体和呈现全屏查看器。

## 核心模式

- 使用 `LazyImage`（或 `AsyncImage`）加载远程图片并附带加载状态。
- 优先使用轻量级预览组件进行内联媒体展示。
- 使用共享的查看器状态（例如 `QuickLook`）呈现全屏媒体查看器。
- 在桌面端/visionOS 上使用 `openWindow`，在 iOS 上使用 sheet。

## 示例：内联媒体预览

```swift
struct MediaPreviewRow: View {
  @Environment(QuickLook.self) private var quickLook

  let attachments: [MediaAttachment]

  var body: some View {
    ScrollView(.horizontal, showsIndicators: false) {
      HStack {
        ForEach(attachments) { attachment in
          LazyImage(url: attachment.previewURL) { state in
            if let image = state.image {
              image.resizable().aspectRatio(contentMode: .fill)
            } else {
              ProgressView()
            }
          }
          .frame(width: 120, height: 120)
          .clipped()
          .onTapGesture {
            quickLook.prepareFor(
              selectedMediaAttachment: attachment,
              mediaAttachments: attachments
            )
          }
        }
      }
    }
  }
}
```

## 示例：全局媒体查看器 sheet

```swift
struct AppRoot: View {
  @State private var quickLook = QuickLook.shared

  var body: some View {
    content
      .environment(quickLook)
      .sheet(item: $quickLook.selectedMediaAttachment) { selected in
        MediaUIView(selectedAttachment: selected, attachments: quickLook.mediaAttachments)
      }
  }
}
```

## 要保留的设计选择

- 保持预览轻量；在查看器中加载全尺寸媒体。
- 使用共享查看器状态，使任何视图都可以打开媒体而无需逐层传递属性。
- 为查看器使用单一入口点（sheet/窗口），避免重复实例。

## 陷阱

- 避免在列表行中加载全尺寸图片；使用调整大小的预览。
- 不要同时展示多个查看器 sheet；保持单一事实源。
