# iOS 排版指南

## 系统字体：San Francisco

iOS 使用 San Francisco（SF Pro）作为默认字体。使用系统文本样式以获得自动Dynamic Type支持。

## 标准文本样式

| 元素 | 字号 | 字重 | 颜色 |
|------|------|------|------|
| 大标题（未滚动） | 34pt | Bold | #000000 |
| 标题（滚动后） | 17pt | Medium | #000000 |
| 正文、列表项 | 17pt | Regular | #000000 |
| 次要文本 | 15pt | Regular | #3C3C43 @ 60% |
| 说明、第三级 | 12-13pt | Regular | #3C3C43 @ 60% |
| 标签栏标签 | 10pt | Regular | #8A8A8E |

## 排版规则

1. **最小文本尺寸**：11pt（用于说明/次要信息）
2. **行高**：段落最小为字体大小的 1.3 倍
3. **行长**：移动端每行 35-50 个字符
4. **对齐**：左对齐，非两端对齐文本
5. **层次**：使用字重和颜色变化，而非极端尺寸
6. **对比度**：最低 4.5:1 比例（WCAG AA 标准）

```swift
// 使用语义文本样式以获得 Dynamic Type 支持
Text("Title")
    .font(.title)

Text("Body content")
    .font(.body)

Text("Caption")
    .font(.caption)
    .foregroundColor(.secondary)
```

## 深色模式排版

- 黑色文本（#000）→ 白色（#FFF）
- 深灰色文本 → 浅灰色文本
- 背景颜色转向更深色（保持相对层次）
