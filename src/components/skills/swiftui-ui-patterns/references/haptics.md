# 触觉反馈

## 意图

适度使用触觉反馈来强化用户操作（标签选择、刷新、成功/错误），并尊重用户偏好。

## 核心模式

- 将触觉触发集中在 `HapticManager` 或类似的工具中。
- 根据用户偏好和硬件支持来控制触觉反馈。
- 对不同 UX 场景使用不同类型（选择 vs. 通知 vs. 刷新）。

## 示例：简单的触觉管理器

```swift
@MainActor
final class HapticManager {
  static let shared = HapticManager()

  enum HapticType {
    case buttonPress
    case tabSelection
    case dataRefresh(intensity: CGFloat)
    case notification(UINotificationFeedbackGenerator.FeedbackType)
  }

  private let selectionGenerator = UISelectionFeedbackGenerator()
  private let impactGenerator = UIImpactFeedbackGenerator(style: .heavy)
  private let notificationGenerator = UINotificationFeedbackGenerator()

  private init() { selectionGenerator.prepare() }

  func fire(_ type: HapticType, isEnabled: Bool) {
    guard isEnabled else { return }
    switch type {
    case .buttonPress:
      impactGenerator.impactOccurred()
    case .tabSelection:
      selectionGenerator.selectionChanged()
    case let .dataRefresh(intensity):
      impactGenerator.impactOccurred(intensity: intensity)
    case let .notification(style):
      notificationGenerator.notificationOccurred(style)
    }
  }
}
```

## 示例：使用方式

```swift
Button("Save") {
  HapticManager.shared.fire(.notification(.success), isEnabled: preferences.hapticsEnabled)
}

TabView(selection: $selectedTab) { /* tabs */ }
  .onChange(of: selectedTab) { _, _ in
    HapticManager.shared.fire(.tabSelection, isEnabled: preferences.hapticTabSelectionEnabled)
  }
```

## 要保留的设计选择

- 触觉反馈应保持微妙，不在每次微小交互时触发。
- 尊重用户偏好（提供关闭的开关）。
- 保持触觉触发器靠近用户操作，不要深入数据层。

## 陷阱

- 避免在快速连续触发多个触觉反馈。
- 不要假设触觉反馈可用；检查是否支持。
