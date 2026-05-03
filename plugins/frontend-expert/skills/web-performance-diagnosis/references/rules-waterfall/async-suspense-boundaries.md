---
title: 策略性 Suspense 边界
impact: HIGH
impactDescription: 加快首次绘制
tags: async, suspense, streaming, layout-shift
---

## 策略性 Suspense 边界

不要等数据加载完再返回 JSX，而是用 Suspense 边界让外层 UI 先行展示，数据加载期间显示 fallback。

**错误（整个页面因数据请求而阻塞）：**

```tsx
async function Page() {
  const data = await fetchData() // 阻塞整个页面

  return (
    <div>
      <div>Sidebar</div>
      <div>Header</div>
      <div>
        <DataDisplay data={data} />
      </div>
      <div>Footer</div>
    </div>
  )
}
```

整个布局都在等数据，但实际上只有中间区域需要它。

**正确（外层立即渲染，数据流式加载）：**

```tsx
function Page() {
  return (
    <div>
      <div>Sidebar</div>
      <div>Header</div>
      <div>
        <Suspense fallback={<Skeleton />}>
          <DataDisplay />
        </Suspense>
      </div>
      <div>Footer</div>
    </div>
  )
}

async function DataDisplay() {
  const data = await fetchData() // 仅阻塞此组件
  return <div>{data.content}</div>
}
```

Sidebar、Header 和 Footer 立即渲染。只有 DataDisplay 等待数据。

**替代方案（多组件共享 Promise）：**

```tsx
function Page() {
  // 立即发起请求，但不 await
  const dataPromise = fetchData()

  return (
    <div>
      <div>Sidebar</div>
      <div>Header</div>
      <Suspense fallback={<Skeleton />}>
        <DataDisplay dataPromise={dataPromise} />
        <DataSummary dataPromise={dataPromise} />
      </Suspense>
      <div>Footer</div>
    </div>
  )
}

function DataDisplay({ dataPromise }: { dataPromise: Promise<Data> }) {
  const data = use(dataPromise) // 解包 Promise
  return <div>{data.content}</div>
}

function DataSummary({ dataPromise }: { dataPromise: Promise<Data> }) {
  const data = use(dataPromise) // 复用同一个 Promise
  return <div>{data.summary}</div>
}
```

两个组件共享同一个 Promise，只发出一次请求。布局立即渲染，两个组件在同一个 Suspense 边界内等待。

**何时不适用：**

- 影响布局决策的关键数据（影响元素定位）
- 首屏 SEO 关键内容
- 小而快的查询，Suspense 开销不值得
- 需要避免布局偏移（loading → 内容跳动）

**取舍：** 更快的首次绘制 vs 可能的布局偏移。根据 UX 优先级选择。
