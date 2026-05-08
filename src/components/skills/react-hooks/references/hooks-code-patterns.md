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

自定义 Hook 与 useMemo 派生值的完整代码见 [references/advanced-patterns.md](./advanced-patterns.md)。
