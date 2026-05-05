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
