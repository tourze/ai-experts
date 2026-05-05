---
title: 对 Script 标签使用 defer 或 async
impact: HIGH
impactDescription: 消除渲染阻塞
tags: rendering, script, defer, async, performance
---

## 对 Script 标签使用 defer 或 async

**影响：HIGH（消除渲染阻塞）**

不带 `defer` 或 `async` 的 script 标签会在下载和执行期间阻塞 HTML 解析，延迟 FCP 和 TTI。

- **`defer`**：并行下载，HTML 解析完成后按顺序执行
- **`async`**：并行下载，下载完立即执行，不保证执行顺序

依赖 DOM 或其他脚本的用 `defer`。独立脚本（如 analytics）用 `async`。

**错误（阻塞渲染）：**

```tsx
export default function Document() {
  return (
    <html>
      <head>
        <script src="https://example.com/analytics.js" />
        <script src="/scripts/utils.js" />
      </head>
      <body>{/* content */}</body>
    </html>
  )
}
```

**正确（非阻塞）：**

```tsx
export default function Document() {
  return (
    <html>
      <head>
        {/* 独立脚本 — 使用 async */}
        <script src="https://example.com/analytics.js" async />
        {/* 依赖 DOM 的脚本 — 使用 defer */}
        <script src="/scripts/utils.js" defer />
      </head>
      <body>{/* content */}</body>
    </html>
  )
}
```

**注意：** 在 Next.js 中，优先使用 `next/script` 组件和 `strategy` prop，而非原始 script 标签：

```tsx
import Script from 'next/script'

export default function Page() {
  return (
    <>
      <Script src="https://example.com/analytics.js" strategy="afterInteractive" />
      <Script src="/scripts/utils.js" strategy="beforeInteractive" />
    </>
  )
}
```

参考：[MDN - Script 元素](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script#defer)
