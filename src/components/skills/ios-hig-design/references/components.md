# iOS UI 组件

## 按钮

**页面级操作**：出现在导航栏（顶部）或操作栏（底部）

```
┌─────────────────────────────────┐
│ Cancel              Save  Edit  │  ← 导航栏操作
├─────────────────────────────────┤
│                                 │
│         页面内容                 │
│                                 │
├─────────────────────────────────┤
│   Share    Copy    Delete       │  ← 操作栏
└─────────────────────────────────┘
```

**页面内按钮**：通常出现在卡片或 Section 上

- 主要按钮：使用主题色填充
- 次要按钮：描边或仅文本
- 破坏性操作：红色文本/颜色

## 列表（表格视图）

列表是 iOS 设计的基础。每行配置方式：

**左侧**（可选）：
- 图标或图片

**中间**：
- 主要文本（17pt 常规）
- 次要文本（15pt 或 12pt，较浅颜色）
- 第三级文本（如有需要）

**右侧**（选择一项）：
- 箭头（→）— 导航到详情界面
- 文本 + 箭头 — 显示当前值，点击可更改
- 勾选标记（✓）— 列表中的单项选择
- 开关 — 开/关切换
- 文本按钮 — 操作链接

## 输入控件

大多数输入都样式化为列表项：

**文本输入**：
```
┌─────────────────────────────────┐
│ Email                           │  ← 提示文本在输入时消失
└─────────────────────────────────┘
```

**开关**：
```
┌─────────────────────────────────┐
│ Notifications          [====○] │
└─────────────────────────────────┘
```

**日期/时间选择器**：
```
┌─────────────────────────────────┐
│ Date          [ Jan 15, 2025 ] │  ← 浅灰色按钮，内联展开
└─────────────────────────────────┘
```

**选择器界面模式**：
- 列表项显示当前值 + 箭头
- 点击导航到选择界面
- 选中的选项用勾选标记标识

## 下拉菜单

用于无需导航的简短选项列表：

```swift
Menu("Options") {
    Button("Edit", action: edit)
    Button("Share", action: share)
    Divider()
    Button("Delete", role: .destructive, action: delete)
}
```

## 触摸目标与间距

### 最小触摸目标

**44 × 44 points** — 所有交互元素不可妥协。

```swift
Button("Tap") {
    // 操作
}
.frame(minWidth: 44, minHeight: 44)
```

### 标准间距值

| 间距 | 用途 |
|------|------|
| 8pt | 紧凑间距（相关元素） |
| 16pt | 标准间距（Section） |
| 20pt | 屏幕边缘边距 |
| 24pt | 宽松间距（主要 Section） |

```swift
VStack(spacing: 16) {
    // 标准组件间距
}
```

---

## 菜单模式

### 上下文菜单

长按显示上下文操作：

```swift
Text("Item")
    .contextMenu {
        Button("Edit", action: edit)
        Button("Share", action: share)
        Divider()
        Button("Delete", role: .destructive, action: delete)
    }
```

**指南：**
- 对相关操作进行分组
- 在分组之间使用分隔线
- 破坏性操作放底部，标记为红色
- 在有用时包含图标

### 下拉菜单

点击显示选项，无需导航：

```swift
Menu("Options") {
    Button("Sort by Name", action: sortByName)
    Button("Sort by Date", action: sortByDate)
    Divider()
    Menu("Filter") {
        Button("Active", action: filterActive)
        Button("Completed", action: filterCompleted)
    }
}
```

**使用时机：**
- 3-6 个不需要全屏的选项
- 不需要额外输入的操作
- 排序、筛选、视图选项

### 操作表

用于需要关注的重要决策：

```swift
.confirmationDialog("Choose Action", isPresented: $showingSheet) {
    Button("Camera") { }
    Button("Photo Library") { }
    Button("Cancel", role: .cancel) { }
}
```

**指南：**
- 标题可选（用于明确性）
- 限制在 5-6 个操作以内
- 取消始终在最后
- 破坏性操作用红色显示

---

## 确认对话框

### 何时需要确认

| 操作 | 需要确认？ |
|------|-----------|
| 删除单个项目 | 有时（如果是永久性的） |
| 删除多个项目 | 是 |
| 放弃未保存的更改 | 是 |
| 登出 | 通常不需要 |
| 发送消息 | 否 |
| 购买 | 是（最后一步） |

### 警告结构

```swift
.alert("Delete Item?", isPresented: $showingAlert) {
    Button("Delete", role: .destructive, action: deleteItem)
    Button("Cancel", role: .cancel) { }
} message: {
    Text("This action cannot be undone.")
}
```

**指南：**
- 标题：清晰的操作问题
- 消息：解释后果（简短）
- 按钮：使用具体动词，不仅仅是"确定"
- 破坏性按钮在左侧（较不常见的位置）
- 取消在右侧（易于点击）

### 撤销 vs. 确认

**优先使用撤销：**
- 操作可恢复
- 速度重要
- 确认对话框会令人烦恼

**需要确认：**
- 操作不可逆
- 可能造成数据/金钱损失
- 操作影响他人

```swift
// 撤销模式
.toolbar {
    Button("Undo") { undoManager.undo() }
}

// 滑动删除带撤销 Toast
.swipeActions(edge: .trailing) {
    Button("Delete", role: .destructive) {
        withAnimation {
            deleteWithUndo(item)
        }
    }
}
```
