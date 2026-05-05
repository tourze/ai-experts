## 代码模式

```tsx
import { useEffect, useReducer, useState } from "react";

type CounterAction =
  | { type: "increment" }
  | { type: "decrement" }
  | { type: "reset"; payload: number };

function counterReducer(state: number, action: CounterAction): number {
  switch (action.type) {
    case "increment":
      return state + 1;
    case "decrement":
      return state - 1;
    case "reset":
      return action.payload;
  }
}

export function Counter({ initial = 0 }: { initial?: number }) {
  const [count, dispatch] = useReducer(counterReducer, initial);
  const [title, setTitle] = useState("Counter");

  useEffect(() => {
    document.title = `${title}: ${count}`;
    return () => {
      document.title = title;
    };
  }, [count, title]);

  return (
    <div>
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
      <span>{count}</span>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
      <button onClick={() => dispatch({ type: "reset", payload: initial })}>重置</button>
      <input value={title} onChange={(event) => setTitle(event.target.value)} />
    </div>
  );
}
```

自定义 Hook 与 useMemo 派生值的完整代码见 [references/advanced-patterns.md](references/advanced-patterns.md)。

## 反模式

### FAIL: 用 effect 复制派生 state

```tsx
function PriceDisplay({ items }: { items: Item[] }) {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    setTotal(items.reduce((sum, i) => sum + i.price, 0));
  }, [items]); // 多余的 state + effect，每次多一轮渲染
  return <span>{total}</span>;
}
```

### PASS: 直接计算派生值

```tsx
function PriceDisplay({ items }: { items: Item[] }) {
  const total = items.reduce((sum, i) => sum + i.price, 0);
  return <span>{total}</span>;
}
```

### FAIL: 删依赖压 ESLint

```tsx
useEffect(() => {
  fetchData(userId); // userId 变了不会重新 fetch
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []); // 故意漏掉 userId
```

### PASS: 依赖数组表达真实读集

```tsx
useEffect(() => {
  fetchData(userId);
}, [userId]); // userId 变了自动重新 fetch
```

- 条件调用 Hook，或在普通工具函数里偷偷调用 Hook。
- 默认到处加 `useMemo` / `useCallback`，却没有证明它能改善瓶颈。
- 自定义 Hook 直接访问 `window`、`document`、`localStorage`，在 SSR 下崩溃。
