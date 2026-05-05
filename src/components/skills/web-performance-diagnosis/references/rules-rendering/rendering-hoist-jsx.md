---
title: 提升静态 JSX 元素
impact: LOW
impactDescription: 避免每次渲染重新创建
tags: rendering, jsx, static, optimization
---

## 提升静态 JSX 元素

将静态 JSX 提取到组件外部，避免每次渲染重新创建。

**错误（每次渲染重新创建元素）：**

```tsx
function LoadingSkeleton() {
  return <div className="animate-pulse h-20 bg-gray-200" />
}

function Container() {
  return (
    <div>
      {loading && <LoadingSkeleton />}
    </div>
  )
}
```

**正确（复用同一元素）：**

```tsx
const loadingSkeleton = (
  <div className="animate-pulse h-20 bg-gray-200" />
)

function Container() {
  return (
    <div>
      {loading && loadingSkeleton}
    </div>
  )
}
```

对大型静态 SVG 节点尤其有效，每次渲染重新创建它们的代价很高。

**注意：** 如果项目已启用 [React Compiler](https://react.dev/learn/react-compiler)，编译器会自动提升静态 JSX 元素并优化组件重渲染，无需手动提升。
