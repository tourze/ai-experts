---
title: 抑制预期的 Hydration 不匹配
impact: LOW-MEDIUM
impactDescription: 避免已知差异产生的 hydration 警告噪音
tags: rendering, hydration, ssr, nextjs
---

## 抑制预期的 Hydration 不匹配

在 SSR 框架（如 Next.js）中，某些值在服务端和客户端天然不同（随机 ID、日期、locale/时区格式化）。对于这些*预期内*的不匹配，用 `suppressHydrationWarning` 包裹动态文本以消除噪音警告。不要用它隐藏真正的 bug，也不要过度使用。

**错误（已知的不匹配警告）：**

```tsx
function Timestamp() {
  return <span>{new Date().toLocaleString()}</span>
}
```

**正确（仅抑制预期的不匹配）：**

```tsx
function Timestamp() {
  return (
    <span suppressHydrationWarning>
      {new Date().toLocaleString()}
    </span>
  )
}
```
