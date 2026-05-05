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
