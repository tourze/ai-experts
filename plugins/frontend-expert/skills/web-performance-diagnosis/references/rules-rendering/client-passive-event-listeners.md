---
title: 使用 Passive 事件监听优化滚动性能
impact: MEDIUM
impactDescription: 消除事件监听导致的滚动延迟
tags: client, event-listeners, scrolling, performance, touch, wheel
---

## 使用 Passive 事件监听优化滚动性能

为 touch 和 wheel 事件监听添加 `{ passive: true }` 以启用即时滚动。浏览器通常需要等待监听器执行完毕来检查是否调用了 `preventDefault()`，这会导致滚动延迟。

**错误：**

```typescript
useEffect(() => {
  const handleTouch = (e: TouchEvent) => console.log(e.touches[0].clientX)
  const handleWheel = (e: WheelEvent) => console.log(e.deltaY)

  document.addEventListener('touchstart', handleTouch)
  document.addEventListener('wheel', handleWheel)

  return () => {
    document.removeEventListener('touchstart', handleTouch)
    document.removeEventListener('wheel', handleWheel)
  }
}, [])
```

**正确：**

```typescript
useEffect(() => {
  const handleTouch = (e: TouchEvent) => console.log(e.touches[0].clientX)
  const handleWheel = (e: WheelEvent) => console.log(e.deltaY)

  document.addEventListener('touchstart', handleTouch, { passive: true })
  document.addEventListener('wheel', handleWheel, { passive: true })

  return () => {
    document.removeEventListener('touchstart', handleTouch)
    document.removeEventListener('wheel', handleWheel)
  }
}, [])
```

**使用 passive 的场景：** 埋点/分析、日志记录、任何不调用 `preventDefault()` 的监听器。

**不使用 passive 的场景：** 自定义滑动手势、自定义缩放控制、任何需要 `preventDefault()` 的监听器。
