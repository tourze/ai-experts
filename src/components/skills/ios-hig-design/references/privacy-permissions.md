# iOS 隐私与权限

权限请求、隐私 UI 和建立用户信任的最佳实践。

## 权限请求理念

**核心原则：** 仅在需要时请求权限，解释原因，并尊重"拒绝"。

用户越来越对权限感到疲劳。每个不必要或时机不当的请求都会损害信任并增加拒绝率。

---

## 权限请求时机

### 即时请求

在用户执行需要权限的操作时请求权限，而不是在应用启动时。

**不好：** 首次启动时请求相机权限
**好：** 在用户点击"拍照"时请求相机权限

### 预权限模式

在系统对话框之前，显示一个自定义界面解释价值。

```
┌─────────────────────────────────────────┐
│                                         │
│         [相机图标]                      │
│                                         │
│    拍摄您的收据照片                     │
│                                         │
│    我们使用您的相机快速扫描和            │
│    整理您的支出。                        │
│    照片仅存储在您的设备上。              │
│                                         │
│    ┌─────────────────────────────────┐  │
│    │        允许使用相机             │  │
│    └─────────────────────────────────┘  │
│                                         │
│            稍后再说                     │
│                                         │
└─────────────────────────────────────────┘
```

**好处：**
- 在系统对话框之前解释价值
- "稍后再说"不会触发系统拒绝
- 更高的接受率
- 更好的用户理解

### 系统权限对话框

```swift
// 相机
AVCaptureDevice.requestAccess(for: .video) { granted in
    // 处理响应
}

// 照片库
PHPhotoLibrary.requestAuthorization(for: .readWrite) { status in
    // 处理状态
}

// 位置
locationManager.requestWhenInUseAuthorization()
// 或
locationManager.requestAlwaysAuthorization()

// 通知
UNUserNotificationCenter.current().requestAuthorization(
    options: [.alert, .badge, .sound]
) { granted, error in
    // 处理响应
}
```

---

## 权限类型与最佳实践

### 相机

**请求时机：** 当用户发起相机操作时

**使用说明字符串示例：**
"[App] 需要相机访问权限，以便为您的项目扫描文档和拍摄照片。"

**最佳实践：**
- 仅在使用相机功能时请求
- 提供照片库作为替代方案
- 优雅地处理拒绝（显示库选项）

### 照片库

**访问级别（iOS 14+）：**
- `.addOnly` - 可以添加照片，不能读取（用于保存）
- `.readWrite` - 完全访问
- 有限选择 - 用户选择特定照片

**请求时机：** 当用户想要访问照片时

**使用说明字符串示例：**
"[App] 访问您的照片，以便您向帖子添加图片。"

**最佳实践：**
- 如果只需要保存，请求 `.addOnly`
- 支持有限照片选择（不需要完全访问）
- 一次性选择使用 PHPicker（无需权限）

```swift
// PHPicker - 无需权限
var config = PHPickerConfiguration()
config.selectionLimit = 1
config.filter = .images

let picker = PHPickerViewController(configuration: config)
```

### 位置

**授权级别：**
- `.whenInUse` - 仅在应用活动时
- `.always` - 后台位置访问

**请求时机：** 当需要位置功能时

**需要使用的字符串：**
- `NSLocationWhenInUseUsageDescription`
- `NSLocationAlwaysAndWhenInUseUsageDescription`（用于始终）

**最佳实践：**
- 从"使用时"开始，之后再请求"始终"
- 解释为什么需要后台位置
- 即使没有位置也提供价值
- 如果不需要精确定位，使用显著位置变化

```swift
// 首先请求使用中
locationManager.requestWhenInUseAuthorization()

// 之后，如果需要，升级到始终
// （触发新的系统提示解释升级原因）
locationManager.requestAlwaysAuthorization()
```

### 通知

**请求时机：** 在用户体验到应用价值之后

**使用说明字符串示例：**
"[App] 发送来自您团队的消息和重要更新的通知。"

**最佳实践：**
- 不要在首次启动时请求
- 等到用户看到价值
- 解释他们会收到什么通知
- 提供应用内通知偏好设置
- 尊重系统设置

**临时通知（iOS 12+）：**
```swift
// 静默投递到通知中心
// 用户可以选择保留或关闭
UNUserNotificationCenter.current().requestAuthorization(
    options: [.provisional, .alert, .sound]
) { granted, error in }
```

### 通讯录

**请求时机：** 当用户发起与通讯录相关的功能时

**使用说明字符串示例：**
"[App] 访问您的通讯录，帮助您邀请朋友和查找认识的人。"

**最佳实践：**
- 尽可能使用 CNContactPickerViewController（无需权限）
- 仅在真正需要时请求完全访问
- 未经明确许可，绝不同步通讯录

### 麦克风

**请求时机：** 当用户发起音频录制时

**使用说明字符串示例：**
"[App] 使用您的麦克风录制语音消息和音频笔记。"

**最佳实践：**
- 录制时有明确的指示器
- 提供发送前预览的选项
- 解释音频的存储/传输方式

### 健康数据

**请求时机：** 当用户启用健康功能时

**最佳实践：**
- 仅请求所需的具体数据类型
- 解释数据将如何使用
- 即使没有健康访问权限也提供价值
- 处理部分授权

### 跟踪（ATT）

**请求时机：** 在跨应用跟踪用户之前

**必需的提示：**
```swift
ATTrackingManager.requestTrackingAuthorization { status in
    switch status {
    case .authorized:
        // 启用跟踪
    case .denied, .restricted:
        // 禁用跟踪
    case .notDetermined:
        // 尚未显示请求
    }
}
```

**最佳实践：**
- 首先解释个性化广告的价值
- 不要惩罚拒绝的用户
- 应用必须在没有跟踪的情况下也能运行

---

## 处理被拒绝的权限

### 优雅降级

当权限被拒绝时，始终提供替代路径。

| 被拒绝的权限 | 替代方案 |
|-------------|---------|
| 相机 | 照片库选项 |
| 位置 | 手动地址输入 |
| 通知 | 应用内消息中心 |
| 通讯录 | 手动联系人输入 |
| 照片 | 仅相机选项 |

### 拒绝后重新请求

一旦被拒绝，系统不会再次显示提示。引导用户前往设置。

```swift
func openAppSettings() {
    guard let settingsUrl = URL(string: UIApplication.openSettingsURLString),
          UIApplication.shared.canOpenURL(settingsUrl) else {
        return
    }
    UIApplication.shared.open(settingsUrl)
}
```

**UI 模式：**
```
┌─────────────────────────────────────────┐
│                                         │
│         需要相机访问权限                │
│                                         │
│    要扫描文档，请在设置中                │
│    允许相机访问。                        │
│                                         │
│    ┌─────────────────────────────────┐  │
│    │        打开设置                 │  │
│    └─────────────────────────────────┘  │
│                                         │
│            现在不用                     │
│                                         │
└─────────────────────────────────────────┘
```

### 会话内不再询问

如果用户在预权限界面上点击"稍后再说"，不要立即再次询问。

```swift
// 记录关闭
UserDefaults.standard.set(Date(), forKey: "camera_prompt_dismissed")

// 等待后再展示
func shouldShowCameraPrompt() -> Bool {
    guard let lastDismissed = UserDefaults.standard.object(
        forKey: "camera_prompt_dismissed"
    ) as? Date else {
        return true
    }
    // 等待至少 3 天
    return Date().timeIntervalSince(lastDismissed) > 3 * 24 * 60 * 60
}
```

---

## 隐私 UI 模式

### 权限状态指示器

在设置中显示当前权限状态：

```
┌─────────────────────────────────────────┐
│ 权限                                     │
├─────────────────────────────────────────┤
│ 📷 相机                        已允许  ▶ │
│ 📍 位置                        使用中▶ │
│ 🔔 通知                        已关闭  ▶ │
│ 📱 通讯录                      未请求  ▶ │
└─────────────────────────────────────────┘
```

### 数据使用透明度

解释收集了哪些数据以及原因：

```
┌─────────────────────────────────────────┐
│ 隐私                                     │
├─────────────────────────────────────────┤
│                                         │
│ 我们收集的数据                          │
│                                         │
│ • 使用分析                              │
│   用于改进应用性能                       │
│                                         │
│ • 崩溃报告                              │
│   用于修复错误和问题                     │
│                                         │
│ • 您上传的照片                          │
│   安全存储在我们的服务器上               │
│                                         │
│ [查看隐私政策]                          │
│                                         │
└─────────────────────────────────────────┘
```

### 数据删除选项

提供清晰的数据管理：

```
┌─────────────────────────────────────────┐
│ 您的数据                                 │
├─────────────────────────────────────────┤
│ 下载我的数据                          ▶ │
│ 删除我的账户                          ▶ │
└─────────────────────────────────────────┘
```

---

## 应用隐私标签

### 必需类别

您的 App Store 列表必须声明：

**用于追踪您的数据**
- 用于跨应用广告的数据

**与您关联的数据**
- 可识别数据（姓名、邮箱等）

**不与您关联的数据**
- 匿名分析、崩溃数据

### 最佳实践

- 准确无误——Apple 会验证
- 最小化收集以减小标签大小
- 更简单的标签建立信任
- 在收集内容变化时更新

---

## 使用说明字符串最佳实践

### 结构

```
"[应用名称][操作]以[用户利益]。"
```

### 按权限分类的示例

| 权限 | 好的示例 |
|------|---------|
| 相机 | "MyApp 使用相机扫描条码以便快速查询产品。" |
| 照片 | "MyApp 将您创建的图片保存到您的照片库。" |
| 位置 | "MyApp 使用您的位置显示附近的餐厅和预计送达时间。" |
| 麦克风 | "MyApp 使用麦克风为您的日记条目录制语音笔记。" |
| 通讯录 | "MyApp 访问通讯录帮助您与朋友分摊账单。" |

### 避免的内容

- 泛泛的解释（"为了改善您的体验"）
- 技术术语
- 提及广告而未解释价值
- 对数据使用含糊其辞

---

## 测试权限

### 重置权限

```bash
# 重置特定应用的所有权限
xcrun simctl privacy booted reset all com.yourapp.bundleid

# 重置特定权限
xcrun simctl privacy booted reset camera com.yourapp.bundleid
```

### 测试所有状态

对于每个权限：
1. 从未请求（首次启动）
2. 已授权
3. 已拒绝
4. 受限（家长控制）
5. 有限（照片）
6. 临时（通知）

### 自动化测试

```swift
func testCameraPermissionDenied() {
    // 设置模拟授权状态
    mockCameraAuthorization = .denied

    // 触发相机功能
    app.buttons["Take Photo"].tap()

    // 验证降级 UI 出现
    XCTAssertTrue(app.staticTexts["Camera access needed"].exists)
    XCTAssertTrue(app.buttons["Open Settings"].exists)
}
```
