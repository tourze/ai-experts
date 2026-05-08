# iOS 手势与交互

## 标准手势（切勿覆盖）

| 手势 | 标准操作 |
|------|---------|
| 从左边缘右滑 | 导航返回 |
| 在模态上向下滑动 | 关闭模态 |
| 在列表上向下拉 | 刷新内容 |
| 在行上左滑 | 显示操作（删除等） |
| 捏合 | 放大/缩小 |
| 长按 | 上下文菜单 |

## 触觉反馈

为有意义的交互提供触觉反馈：

```swift
// 冲击反馈（物理操作）
let impact = UIImpactFeedbackGenerator(style: .medium)
impact.impactOccurred()

// 通知反馈（结果）
let notification = UINotificationFeedbackGenerator()
notification.notificationOccurred(.success)  // 或 .warning, .error

// 选择反馈（UI 变化）
let selection = UISelectionFeedbackGenerator()
selection.selectionChanged()
```

## 动画指南

- 使用 spring 动画获得自然、有弹性的感觉
- 尊重 `reduceMotion` 无障碍设置
- 保持动画简短且有目的性

```swift
@Environment(\.accessibilityReduceMotion) var reduceMotion

var animation: Animation {
    reduceMotion ? .none : .spring()
}

withAnimation(animation) {
    // 动画化属性变化
}
```
