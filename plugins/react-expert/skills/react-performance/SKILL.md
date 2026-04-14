---
name: react-performance
description: 适用于 React 渲染性能分析与优化，包括 memoization、虚拟列表、代码分割、Profiler、稳定引用与 bundle 负担。用户提到慢组件、重渲染、memo、virtualization、code splitting、bundle size 时使用。
---

# React 性能优化

## 适用场景

- 某个页面、组件树或交互明显卡顿，需要确认热点在哪里。
- 需要决定 `memo`、`useMemo`、`useCallback`、虚拟列表、懒加载是否值得上。
- 需要用 React DevTools Profiler、浏览器 Performance 面板或 bundle 分析找瓶颈。
- 外部 store 订阅导致的重复渲染，优先联动 [react-render-performance](../react-render-performance/SKILL.md)。
- Next.js / RSC / Server Actions 场景，优先联动 [react-server-components](../react-server-components/SKILL.md) 与 [vercel-react-best-practices](../vercel-react-best-practices/SKILL.md)。

## 核心约束

- 先测量，再优化；没有 flamegraph 或计时数据，先别动 `memo`。
- 优先修“高频且昂贵”的路径，而不是到处铺微优化。
- `memo` 生效的前提是 props 稳定；如果父组件每次都造新对象，`memo` 等于没用。
- `useMemo` 里的计算必须是昂贵或会破坏引用稳定性；简单表达式不要包。
- 大列表优先做虚拟化，懒加载优先放在路由和大功能块边界。
- 排序、过滤、映射若会破坏原数组，先复制再处理，别在 render 里隐式 mutate。

## 代码模式

```tsx
import { memo, useMemo } from "react";

type Item = { id: string; name: string };

const List = memo(function List({ items }: { items: Item[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
});

export function SortedList({ items }: { items: Item[] }) {
  const sortedItems = useMemo(
    () => [...items].sort((left, right) => left.name.localeCompare(right.name)),
    [items],
  );

  return <List items={sortedItems} />;
}
```

```tsx
import { lazy, Suspense } from "react";

const HeavyChart = lazy(() => import("./HeavyChart"));

export function AnalyticsPanel({ visible }: { visible: boolean }) {
  if (!visible) {
    return null;
  }

  return (
    <Suspense fallback={<div>Loading…</div>}>
      <HeavyChart />
    </Suspense>
  );
}
```

```tsx
import { Profiler } from "react";

export function ProfiledSection() {
  const items = [{ id: "1", name: "Ada" }];

  return (
    <Profiler
      id="ProductGrid"
      onRender={(id, phase, actualDuration) => {
        console.log({ id, phase, actualDuration });
      }}
    >
      <SortedList items={items} />
    </Profiler>
  );
}
```

## 检查清单

- [ ] 是否先用 Profiler、Performance 面板或自定义计时确认了热点？
- [ ] `memo` / `useMemo` / `useCallback` 的收益是否有证据，而不是凭感觉？
- [ ] 传给 memoized child 的对象、数组、回调是否稳定？
- [ ] 大列表是否已经虚拟化，而不是一次性全量渲染？
- [ ] 路由、大图表、富编辑器等重模块是否考虑了懒加载或代码分割？
- [ ] 优化前后是否有可对比数据（commit time、interaction latency、bundle size）？

## 反模式

- 给几乎所有组件包 `memo`，最后增加复杂度却没有收益。
- 在 render 里 `items.sort(...)`、`array.reverse()` 等原地修改输入数据。
- 父组件每次都创建新对象、新数组、新函数，却指望子组件 `memo` 生效。
- 在小型纯展示组件上过度使用 `useMemo` / `useCallback`。
- 列表性能差却不做虚拟化，只靠“拆组件”“加 memo”硬撑。
- 把测试慢、网络慢、服务端慢误判成 React 渲染慢。测试任务可联动 [javascript-typescript-jest](../../../javascript-expert/skills/javascript-typescript-jest/SKILL.md)。
