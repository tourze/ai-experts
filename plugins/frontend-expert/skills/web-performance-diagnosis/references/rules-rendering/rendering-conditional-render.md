---
title: 使用显式条件渲染
impact: LOW
impactDescription: 避免渲染 0 或 NaN
tags: rendering, conditional, jsx, falsy-values
---

## 使用显式条件渲染

当条件可能为 `0`、`NaN` 或其他会渲染的 falsy 值时，用显式三元运算符（`? :`）代替 `&&`。

**错误（count 为 0 时渲染 "0"）：**

```tsx
function Badge({ count }: { count: number }) {
  return (
    <div>
      {count && <span className="badge">{count}</span>}
    </div>
  )
}

// count = 0 时渲染: <div>0</div>
// count = 5 时渲染: <div><span class="badge">5</span></div>
```

**正确（count 为 0 时什么都不渲染）：**

```tsx
function Badge({ count }: { count: number }) {
  return (
    <div>
      {count > 0 ? <span className="badge">{count}</span> : null}
    </div>
  )
}

// count = 0 时渲染: <div></div>
// count = 5 时渲染: <div><span class="badge">5</span></div>
```
