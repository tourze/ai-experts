## Swift 6.2 中的并发编程更新

并发编程之所以困难，是因为在多个任务之间共享内存容易出错，导致不可预测的行为。

## 数据竞争安全

 Swift 6 中的数据竞争安全在编译时防止这些错误，让你可以编写并发代码而无需担心引入难以调试的运行时 bug。但在许多情况下，最自然的代码编写方式容易产生数据竞争，导致你需要处理的编译器错误。像这个 `PhotoProcessor` 类这样的具有可变状态的类，只要你不并发访问它就是安全的。

```swift
class PhotoProcessor {
  func extractSticker(data: Data, with id: String?) async -> Sticker? {     }
}

@MainActor
final class StickerModel {
  let photoProcessor = PhotoProcessor()

  func extractSticker(_ item: PhotosPickerItem) async throws -> Sticker? {
    guard let data = try await item.loadTransferable(type: Data.self) else {
      return nil
    }

    // Error: Sending 'self.photoProcessor' risks causing data races
    // Sending main actor-isolated 'self.photoProcessor' to nonisolated instance method 'extractSticker(data:with:)'
    // risks causing data races between nonisolated and main actor-isolated uses
    return await photoProcessor.extractSticker(data: data, with: item.itemIdentifier)
  }
}
```

 它有一个异步方法，通过计算给定图像数据的主体来提取 `Sticker`。但如果你尝试从主 actor 上的 UI 代码调用 `extractSticker`，你会得到一个错误，表示该调用可能导致数据竞争。这是因为语言中有多个地方会隐式地将工作卸载到后台，即使你从不需要代码并行运行。

Swift 6.2 改变了这一理念，默认保持单线程，直到你选择引入并发。

```swift
class PhotoProcessor {
  func extractSticker(data: Data, with id: String?) async -> Sticker? {     }
}

@MainActor
final class StickerModel {
  let photoProcessor = PhotoProcessor()

  func extractSticker(_ item: PhotosPickerItem) async throws -> Sticker? {
    guard let data = try await item.loadTransferable(type: Data.self) else {
      return nil
    }

    // 在 Swift 6.2 中由于平易近人的并发和默认 actor 隔离，不再有数据竞争错误
    return await photoProcessor.extractSticker(data: data, with: item.itemIdentifier)
  }
}
```

Swift 6.2 中的语言更改使最自然的代码编写方式默认就是无数据竞争的。这为在项目中引入并发提供了一条更平易近人的路径。

当你选择引入并发以并行运行代码时，数据竞争安全将保护你。

首先，我们使在具有可变状态的类型上调用异步函数变得更加容易。异步函数不再急于卸载到未绑定到特定 actor 的执行器，而是继续在调用它的 actor 上运行。这消除了数据竞争，因为传入异步函数的值永远不会被发送到 actor 之外。异步函数仍可以在其实现中卸载工作，但调用方不必担心其可变状态。

接下来，我们使在主 actor 类型上实现协议遵循变得更加容易。这里我有一个名为 `Exportable` 的协议，我正试图为我的主 actor `StickerModel` 类实现遵循。导出需求没有 actor 隔离，因此语言假设它可能从主 actor 之外被调用，并阻止 `StickerModel` 在其实现中使用主 actor 状态。

```swift
protocol Exportable {
  func export()
}

extension StickerModel: Exportable { // error: Conformance of 'StickerModel' to protocol 'Exportable' crosses into main actor-isolated code and can cause data races
  func export() {
    photoProcessor.exportAsPNG()
  }
}
```

Swift 6.2 支持这些遵循。需要主 actor 状态的遵循称为*隔离遵循*。这是安全的，因为编译器确保主 actor 遵循只会在主 actor 上使用。

```swift
// 隔离遵循

protocol Exportable {
  func export()
}

extension StickerModel: @MainActor Exportable {
  func export() {
    photoProcessor.exportAsPNG()
  }
}
```

 我可以创建一个 `ImageExporter` 类型，只要它停留在主 actor 上，就可以将 `StickerModel` 添加到任何 `Exportable` 项的数组中。

```swift
 // 隔离遵循

@MainActor
struct ImageExporter {
  var items: [any Exportable]

  mutating func add(_ item: StickerModel) {
    items.append(item)
  }

  func exportAll() {
    for item in items {
      item.export()
    }
  }
}
```

但如果我允许 `ImageExporter` 从任何地方使用，编译器会阻止将 `StickerModel` 添加到数组中，因为从主 actor 外部调用 `StickerModel` 的导出是不安全的。

```swift
// 隔离遵循

nonisolated
struct ImageExporter {
  var items: [any Exportable]

  mutating func add(_ item: StickerModel) {
    items.append(item) // error: Main actor-isolated conformance of 'StickerModel' to 'Exportable' cannot be used in nonisolated context
  }

  func exportAll() {
    for item in items {
      item.export()
    }
  }
}
```

通过隔离遵循，只有当代码表明它正在并发使用该遵循时，你才需要解决数据竞争安全问题。

## 全局状态

全局变量和静态变量容易产生数据竞争，因为它们允许从任何地方访问可变状态。

```swift
final class StickerLibrary {
  static let shared: StickerLibrary = .init() // error: Static property 'shared' is not concurrency-safe because non-'Sendable' type 'StickerLibrary' may have shared mutable state
}
```

保护全局状态最常见的方式是使用主 actor。

```swift
final class StickerLibrary {
  @MainActor
  static let shared: StickerLibrary = .init()
}
```

 特别是，在一个没有太多并发任务的项目中，使用主 actor 注解整个类以保护其所有可变状态是很常见的。

```swift
@MainActor
final class StickerLibrary {
  static let shared: StickerLibrary = .init()
}
```

你可以通过在项目中的所有内容上编写 `@MainActor` 来建模一个完全单线程的程序。

```swift
@MainActor
final class StickerLibrary {
  static let shared: StickerLibrary = .init()
}

@MainActor
final class StickerModel {
  let photoProcessor: PhotoProcessor

  var selection: [PhotosPickerItem]
}

extension StickerModel: @MainActor Exportable {
  func export() {
    photoProcessor.exportAsPNG()
  }
}
```

为了使建模单线程代码更容易，我们引入了一种默认推断主 actor 的模式。

```swift
// Swift 6.2 中默认推断主 actor 的模式

final class StickerLibrary {
  static let shared: StickerLibrary = .init()
}

final class StickerModel {
  let photoProcessor: PhotoProcessor

  var selection: [PhotosPickerItem]
}

extension StickerModel: Exportable {
  func export() {
    photoProcessor.exportAsPNG()
  }
}
```

 这消除了关于不安全的全局和静态变量、对其他主 actor 函数（如 SDK 中的函数）的调用等数据竞争安全错误，因为主 actor 默认保护所有可变状态。它还减少了在大多是单线程的代码中的并发注解。这种模式非常适合大部分工作都在主 actor 上完成的项目，并发代码封装在特定类型或文件中。这是可选的，推荐用于应用程序、脚本和其他可执行目标。

## 将工作卸载到后台

将工作卸载到后台对于性能仍然很重要，例如在执行 CPU 密集型任务时保持应用程序响应。

让我们看看 `PhotoProcessor` 上 `extractSticker` 方法的实现。

```swift
// 显式卸载异步工作

class PhotoProcessor {
  var cachedStickers: [String: Sticker]

  func extractSticker(data: Data, with id: String) async -> Sticker {
      if let sticker = cachedStickers[id] {
        return sticker
      }

      let sticker = await Self.extractSubject(from: data)
      cachedStickers[id] = sticker
      return sticker
  }

  // 使用 @concurrent 属性卸载昂贵的图像处理任务
  @concurrent
  static func extractSubject(from data: Data) async -> Sticker { }
}
```

它首先检查是否已经提取了图像的贴纸，以便立即返回缓存的贴纸。如果贴纸尚未缓存，则从图像数据中提取主体并创建新的贴纸。`extractSubject` 方法执行昂贵的图像处理，我不希望它阻塞主 actor 或任何其他 actor。

我可以使用 `@concurrent` 属性卸载此工作。`@concurrent` 确保函数始终在并发线程池上运行，从而释放 actor 以同时运行其他任务。

### 示例

假设你有一个名为 `process` 的函数，你希望它在后台线程上运行。要在后台线程上调用该函数，你需要：

- 确保结构体或类是 `nonisolated`
- 在要运行在后台的函数上添加 `@concurrent` 属性
- 如果函数尚未异步，则添加关键字 `async`
- 然后在所有调用方中添加关键字 `await`

就像这样：

```swift
nonisolated struct PhotoProcessor {

    @concurrent
    func process(data: Data) async -> ProcessedPhoto? { ... }
}

// 调用方添加 await
processedPhotos[item.id] = await PhotoProcessor().process(data: data)
```


## 总结

这些语言更改共同使并发更加平易近人。

你从编写默认在主 actor 上运行的代码开始，这里不存在数据竞争风险。当你开始使用异步函数时，这些函数在调用它们的地方运行。仍然没有数据竞争风险，因为你所有的代码仍然在主 actor 上运行。当你准备拥抱并发以提高性能时，很容易将特定代码卸载到后台以并行运行。

其中一些语言更改是可选的，因为它们需要你的项目进行更改才能采用。你可以在 Xcode 构建设置的 Swift Compiler - Concurrency 部分找到并启用所有平易近人的并发语言更改。你也可以在 Swift package manifest 文件中使用 SwiftSettings API 启用这些功能。

 Swift 6.2 包含迁移工具，以帮助你自动进行必要的代码更改。你可以在 swift.org/migration 了解更多关于迁移工具的信息。
