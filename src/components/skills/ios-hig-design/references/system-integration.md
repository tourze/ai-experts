# iOS 系统集成

Siri、Shortcuts、Handoff、拖放和其他系统级集成。

## Siri 集成

### SiriKit 领域

您的应用可以通过预定义领域与 Siri 集成：

| 领域 | 示例意图 |
|------|---------|
| 消息 | 发送消息、搜索消息 |
| 列表与笔记 | 创建笔记、添加到列表 |
| 支付 | 发送付款、请求付款 |
| 锻炼 | 开始锻炼、结束锻炼 |
| 媒体 | 播放媒体、添加到库 |
| 乘车预订 | 请求乘车、获取乘车状态 |
| 汽车命令 | 锁车、获取车辆状态 |
| 视觉码 | 查找条码、二维码 |

### 语音设计

**确认对话框：**
```
Siri："向 Sarah 发送 50 美元用于晚餐？"
用户："是" / "更改金额" / "取消"
```

**指南：**
- 确认重要操作
- 允许轻松纠正
- 在语音之外提供视觉反馈
- 优雅地处理歧义

### 自定义意图

用于不在预定义领域中的操作：

```swift
// 在 Intents.intentdefinition 中定义
Intent: OrderCoffee
Parameters: coffeeType, size, location
```

**最佳实践：**
- 使用描述性参数名称
- 提供好的示例
- 支持同义词
- 用不同的措辞进行测试

### Siri 快捷指令

允许用户创建自定义语音触发器：

```swift
// 在用户完成操作时捐赠快捷指令
let activity = NSUserActivity(activityType: "com.app.order-favorite")
activity.title = "Order my usual coffee"
activity.isEligibleForSearch = true
activity.isEligibleForPrediction = true
activity.suggestedInvocationPhrase = "Order my usual"

view.userActivity = activity
```

**指南：**
- 为重复操作捐赠快捷指令
- 建议清晰的调用短语
- 提供相关参数
- 在 Shortcuts 应用中测试

---

## Shortcuts 应用集成

### 应用快捷指令（iOS 16+）

自动出现的预构建快捷指令：

```swift
struct MyAppShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: OrderCoffeeIntent(),
            phrases: [
                "Order coffee with \(.applicationName)",
                "Get my usual from \(.applicationName)"
            ],
            shortTitle: "Order Coffee",
            systemImageName: "cup.and.saucer.fill"
        )
    }
}
```

### 快捷指令操作

将应用功能暴露为 Shortcuts 操作：

**好的候选：**
- 用户频繁重复的操作
- 可以在没有 UI 的情况下运行的操作
- 可以传递给其他应用的数据
- 可自动化的工作流

**设计考虑：**
- 清晰的操作名称（动词 + 对象）
- 有默认值的有意义的参数
- 用于链式操作的有用输出
- 解释出了什么问题的错误消息

---

## Handoff

### 启用 Handoff

允许用户跨 Apple 设备继续活动：

```swift
let activity = NSUserActivity(activityType: "com.app.viewing-item")
activity.title = "Viewing Product: \(product.name)"
activity.userInfo = ["productID": product.id]
activity.isEligibleForHandoff = true
activity.webpageURL = URL(string: "https://myapp.com/product/\(product.id)")

userActivity = activity
```

### Handoff 指南

**应做：**
- 精确地从用户离开的地方继续
- 恢复滚动位置、表单状态等
- 支持通用链接作为降级方案
- 随上下文变化更新活动

**不应做：**
- 要求重新认证
- 丢失用户的工作
- 显示显著不同的内容

### Web 降级方案

如果接收设备上未安装应用：
```swift
activity.webpageURL = URL(string: "https://myapp.com/activity/\(id)")
```

---

## 拖放

### 支持拖拽

```swift
.draggable(item) {
    // 拖拽预览
    ItemPreview(item: item)
}
```

### 支持放置

```swift
.dropDestination(for: ItemType.self) { items, location in
    // 处理放置的项目
    return true
}
```

### 拖放指南

**视觉反馈：**
- 显示清晰的拖拽预览
- 指示有效的放置目标
- 平滑地动画化过渡

**多项：**
- 支持选择多个项目
- 为多个项目堆叠预览
- 处理批量操作

**跨应用：**
- 导出标准数据类型（图片、文本、URL）
- 接受常见格式
- 在传输期间保持质量

### 平台考虑

| 平台 | 拖拽启动 |
|------|---------|
| iPhone | 长按 + 拖拽（应用内） |
| iPad | 长按或点击 + 拖拽 |
| Mac（Catalyst） | 点击 + 拖拽 |

---

## 通用链接

### 设置

1. 在服务器上配置 `apple-app-site-association`：
```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAMID.com.example.app",
      "paths": ["/product/*", "/user/*"]
    }]
  }
}
```

2. 添加关联域功能：
```
applinks:example.com
```

### 处理链接

```swift
func application(_ application: UIApplication,
                 continue userActivity: NSUserActivity,
                 restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    guard userActivity.activityType == NSUserActivityTypeBrowsingWeb,
          let url = userActivity.webpageURL else {
        return false
    }
    return handleUniversalLink(url)
}
```

### 最佳实践

- 稳健地解析 URL（处理格式错误的链接）
- 导航到适当的界面
- 立即显示内容（不要先要求登录）
- 在内容不可用时优雅降级

---

## Spotlight 搜索

### 索引内容

```swift
let attributeSet = CSSearchableItemAttributeSet(contentType: .text)
attributeSet.title = item.title
attributeSet.contentDescription = item.description
attributeSet.thumbnailData = item.thumbnailData

let searchableItem = CSSearchableItem(
    uniqueIdentifier: item.id,
    domainIdentifier: "com.app.items",
    attributeSet: attributeSet
)

CSSearchableIndex.default().indexSearchableItems([searchableItem])
```

### 索引什么

**好的候选：**
- 用户内容（笔记、文档）
- 保存的项目（收藏夹、历史）
- 频繁访问的项目

**避免：**
- 敏感数据
- 临时内容
- 每个可能的项目（要有选择性）

### 搜索结果设计

结果出现在 Spotlight 中：
```
┌─────────────────────────────────────────┐
│ 🔲 我的笔记标题                         │
│    笔记内容预览...                      │
│    MyApp                                │
└─────────────────────────────────────────┘
```

**包含：**
- 清晰的标题
- 有帮助的描述
- 如果是视觉内容则带缩略图
- 准确的元数据

---

## 专注与通知

### 专注感知

尊重用户的专注模式：

```swift
UNUserNotificationCenter.current().getNotificationSettings { settings in
    if settings.notificationCenterSetting == .disabled {
        // 用户已静音通知
    }
}
```

### 时效性通知

用于真正紧急的通知：

```swift
let content = UNMutableNotificationContent()
content.title = "Your ride is here"
content.interruptionLevel = .timeSensitive
```

**仅在以下情况使用：**
- 需要立即操作
- 用户明确选择加入
- 内容真正具有时效性

---

## 快速笔记集成

### 添加快速笔记功能

允许为快速笔记高亮内容：

```swift
Text(content)
    .contextMenu {
        Button("Add to Quick Note") {
            // 系统处理此操作
        }
    }
```

---

## SharePlay

### 何时使用 SharePlay

- 一起观看内容
- 协作活动
- 共享体验

### SharePlay 指南

**同步状态：**
- 保持所有参与者同步
- 优雅地处理网络延迟
- 在适当时提供个人控制

**视觉设计：**
- 显示会话中的参与者
- 在他人互动时指示
- 提供轻松的退出选项

---

## 系统外观

### 支持深色模式

```swift
// 自适应颜色
Color.primary      // 自动浅色/深色
Color.secondary    // 自动浅色/深色

// 自定义自适应颜色
extension Color {
    static let background = Color("Background") // 从资源目录
}
```

### 支持动态类型

```swift
Text("Title")
    .font(.title)      // 随动态类型缩放

// 自定义可缩放字体
.font(.custom("MyFont", size: 17, relativeTo: .body))
```

### 支持无障碍

```swift
Text("Content")
    .accessibilityLabel("Detailed description")
    .accessibilityHint("Tap to view details")
```

---

## 最佳实践总结

| 集成 | 关键考虑 |
|------|---------|
| Siri | 清晰的确认，处理歧义 |
| Shortcuts | 暴露可重复、可自动化的操作 |
| Handoff | 跨设备保持精确状态 |
| 拖放 | 清晰的预览，多项支持 |
| 通用链接 | 深度链接到特定内容 |
| Spotlight | 索引有价值的、非敏感内容 |
| 专注 | 尊重用户的通知偏好 |

**通用原则：** 系统集成应感觉无缝——用户不应思考他们在使用哪个设备或应用。
