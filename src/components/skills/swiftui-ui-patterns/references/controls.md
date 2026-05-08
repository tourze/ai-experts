# 控件（Toggle、Slider、Picker）

## 意图

在设置和配置界面中使用原生控件，保持标签的可无障碍访问性和状态绑定的清晰性。

## 核心模式

- 直接将控件绑定到 `@State`、`@Binding` 或 `@AppStorage`。
- 布尔偏好设置优先使用 `Toggle`。
- 数值范围使用 `Slider`，并在标签中显示当前值。
- 离散选项使用 `Picker`；仅对 2-4 个选项使用 `.pickerStyle(.segmented)`。
- 保持标签可见且具有描述性；避免在控件内部嵌入按钮。

## 示例：带 Section 的 Toggle

```swift
Form {
  Section("Notifications") {
    Toggle("Mentions", isOn: $preferences.notificationsMentionsEnabled)
    Toggle("Follows", isOn: $preferences.notificationsFollowsEnabled)
    Toggle("Boosts", isOn: $preferences.notificationsBoostsEnabled)
  }
}
```

## 示例：带数值文本的 Slider

```swift
Section("Font Size") {
  Slider(value: $fontSizeScale, in: 0.5...1.5, step: 0.1)
  Text("Scale: \(String(format: \"%.1f\", fontSizeScale))")
    .font(.scaledBody)
}
```

## 示例：枚举的 Picker

```swift
Picker("Default Visibility", selection: $visibility) {
  ForEach(Visibility.allCases, id: \.self) { option in
    Text(option.title).tag(option)
  }
}
```

## 要保留的设计选择

- 在 `Form` 的 Section 中对相关控件进行分组。
- 使用 `.disabled(...)` 反映锁定或继承的设置。
- 在 Toggle 内部使用 `Label` 组合图标和文本，当这有助于清晰度时使用。

## 陷阱

- 避免对大量选项使用 `.pickerStyle(.segmented)`；改用菜单或内联样式。
- 不要为 slider 隐藏标签；始终显示上下文。
- 避免在控件中硬编码颜色；谨慎使用主题强调色。
