---
title: CSS content-visibility 优化长列表
impact: HIGH
impactDescription: 加快首次渲染
tags: rendering, css, content-visibility, long-lists
---

## CSS content-visibility 优化长列表

使用 `content-visibility: auto` 延迟屏幕外元素的渲染。

**CSS：**

```css
.message-item {
  content-visibility: auto;
  contain-intrinsic-size: 0 80px;
}
```

**示例：**

```tsx
function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="overflow-y-auto h-screen">
      {messages.map(msg => (
        <div key={msg.id} className="message-item">
          <Avatar user={msg.author} />
          <div>{msg.content}</div>
        </div>
      ))}
    </div>
  )
}
```

对于 1000 条消息，浏览器跳过约 990 个屏幕外项的布局/绘制（首次渲染快 10 倍）。
