---
title: 驱动 SVG 外层容器而非 SVG 元素
impact: LOW
impactDescription: 启用 GPU 硬件加速
tags: rendering, svg, css, animation, performance
---

## 驱动 SVG 外层容器而非 SVG 元素

多数浏览器对 SVG 元素的 CSS3 动画没有硬件加速。将 SVG 包在 `<div>` 中，对外层容器做动画。

**错误（直接对 SVG 做动画 — 无硬件加速）：**

```tsx
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin"
      width="24"
      height="24"
      viewBox="0 0 24 24"
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" />
    </svg>
  )
}
```

**正确（对外层 div 做动画 — 硬件加速）：**

```tsx
function LoadingSpinner() {
  return (
    <div className="animate-spin">
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="10" stroke="currentColor" />
      </svg>
    </div>
  )
}
```

适用于所有 CSS transform 和 transition（`transform`、`opacity`、`translate`、`scale`、`rotate`）。外层 div 让浏览器可以利用 GPU 加速实现更流畅的动画。
