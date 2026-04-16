---
name: ios-hig-design
description: 当用户要按 Apple Human Interface Guidelines 设计 iPhone / iPad 原生界面时使用。适用于 SwiftUI、UIKit、安全区域、导航、无障碍与系统组件相关任务。
license: MIT
metadata:
  author: wondelai
  version: "1.1.1"
---

# iOS HIG 设计

## 适用场景

- 设计或评审 iPhone / iPad 的 SwiftUI、UIKit 界面。
- 用户提到安全区域、Dynamic Island、导航结构、Dynamic Type、SF Symbols 或 HIG 合规。
- 需要把“看起来像 iOS”落实到具体布局、组件和交互决策。

## 核心约束

- 优先使用系统组件与系统导航，不要先造自定义容器。
- 交互控件最小触控面积按 `44x44pt` 设计，并尊重 safe area。
- 文本要使用语义字体样式并验证 Dynamic Type，不要写死字号和行高。
- iPhone 与 iPad 需要分别考虑信息密度、分栏与横屏，不要拿单一尺寸糊过去。

## 代码模式

### 安全区域与底部操作

```swift
NavigationStack {
    List(items) { item in
        Text(item.title)
    }
    .navigationTitle("Inbox")
    .safeAreaInset(edge: .bottom) {
        Button("New Task") { createTask() }
            .buttonStyle(.borderedProminent)
            .padding()
            .frame(maxWidth: .infinity)
            .background(.ultraThinMaterial)
    }
}
```

### 语义字体与系统图标

```swift
VStack(alignment: .leading, spacing: 8) {
    Label("Favorites", systemImage: "star.fill")
        .font(.headline)
    Text("Keep important items within reach.")
        .font(.subheadline)
        .foregroundStyle(.secondary)
}
```

### 权限前置说明

```swift
VStack(spacing: 12) {
    Text("允许相机访问")
        .font(.title3.weight(.semibold))
    Text("我们只在你主动拍照上传时请求权限。")
        .font(.body)
        .multilineTextAlignment(.center)
    Button("继续") { requestCameraPermission() }
        .buttonStyle(.borderedProminent)
}
.padding()
```

## 检查清单

- 布局是否覆盖小屏 iPhone、刘海 / Dynamic Island、Home Indicator、横竖屏。
- 文本是否全部使用语义样式，且在大字号下不截断关键文案。
- 导航是否遵循 iOS 习惯：返回、编辑、搜索、sheet、popover 都有清晰归属。
- 图标、色彩、权限弹窗前文案是否和系统语义一致。
- 交叉引用：SwiftUI 具体实现细节看 `swiftui-ui-patterns`；液态玻璃外观看 `liquid-glass-design`；Mac 端界面看 `macos-design-guidelines`。

## 反模式

### FAIL: 固定字号忽略 Dynamic Type

```swift
Text(“标题”)
    .font(.system(size: 20)) // 大字号用户看到的仍是 20pt，无障碍差评
```

### PASS: 语义字体

```swift
Text(“标题”)
    .font(.title3) // 自动响应用户字号设置
```

### FAIL: 首屏立即弹权限

```swift
.onAppear { requestCameraPermission() } // 用户还没理解为什么要相机就直接拒绝
```

### PASS: 先解释再请求

```swift
VStack {
    Text(“允许相机访问”)
        .font(.title3.weight(.semibold))
    Text(“仅在你主动拍照上传时请求。”)
    Button(“继续”) { requestCameraPermission() }
        .buttonStyle(.borderedProminent)
}
```

- 用 Web / Android 导航模式硬套到 iOS。
- 可点击区域压到 44pt 以下。
