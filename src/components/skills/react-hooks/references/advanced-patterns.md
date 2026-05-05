# React Hooks 进阶代码模式

本文件是 react-hooks SKILL.md 的拆分内容，包含自定义 Hook 与 useMemo 派生值的完整代码。

## 自定义 Hook: useLocalStorageState

```tsx
import { useEffect, useState } from "react";

export function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === "undefined") {
      return initialValue;
    }

    try {
      const raw = window.localStorage.getItem(key);
      return raw == null ? initialValue : (JSON.parse(raw) as T);
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

## useMemo 派生值

```tsx
import { useMemo } from "react";

export function PriceSummary({ items }: { items: { price: number }[] }) {
  const total = useMemo(
    () => items.reduce((sum, item) => sum + item.price, 0),
    [items],
  );

  return <strong>{total}</strong>;
}
```
