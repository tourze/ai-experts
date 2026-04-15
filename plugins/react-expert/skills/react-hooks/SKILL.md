---
name: react-hooks
description: 当用户需要设计自定义 Hook、修复依赖数组、处理 effect 清理或优化状态建模时使用。
---

# React Hooks

## 适用场景

- 需要在 `useState`、`useReducer`、`useRef`、`useEffect` 之间做职责划分。
- 要设计可复用的自定义 Hook，并稳定暴露返回值与错误语义。
- 遇到 effect 重复执行、闭包拿到旧值、依赖数组写不对、清理逻辑遗漏等问题。
- 如果问题已经扩展成“性能优化”或“外部状态订阅”，分别看 [react-performance](../react-performance/SKILL.md) 与 [react-render-performance](../react-render-performance/SKILL.md)。
- 如果任务在 Next.js App Router / RSC 边界上，优先联动 [react-server-components](../react-server-components/SKILL.md)。
- 类型体操很重时，联动 [typescript-magician](../../../typescript-expert/skills/typescript-magician/SKILL.md)。

## 核心约束

- Hook 只能在 React 组件或自定义 Hook 顶层调用，不能放进条件、循环、普通函数。
- `useEffect` 只用于“与 React 外部系统同步”；纯计算、派生值、事件驱动动作不要塞进 effect。
- 依赖数组必须表达真实读集；不要靠注释压 `exhaustive-deps` 规则来“修”闭包问题。
- 需要跨渲染持有可变值时用 `useRef`；需要触发渲染时才用 state。
- 复杂状态机优先 `useReducer`，不要让多个 `useState` 形成隐式事务。
- 自定义 Hook 要处理 SSR、异常输入和清理路径，避免把环境假设硬编码到浏览器端。

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

## 检查清单

- [ ] Hook 是否只在组件或自定义 Hook 顶层调用？
- [ ] effect 的职责是否确实是“同步外部系统”，而不是做纯派生？
- [ ] 依赖数组是否完整表达了 effect / memo / callback 读取的值？
- [ ] 需要清理的订阅、定时器、事件监听是否都在返回函数中释放？
- [ ] 自定义 Hook 是否处理了 SSR、JSON 解析失败、未挂载组件更新等边界？
- [ ] 返回值 API 是否稳定、语义清晰，并且易于测试？

## 反模式

- 条件调用 Hook，或在普通工具函数里偷偷调用 Hook。
- 用 effect 复制派生 state，例如“props 改了就 setState(derivedValue)”。
- 为了压 ESLint，把真实依赖从数组里删掉，换来随机闭包 bug。
- 默认到处加 `useMemo` / `useCallback`，却没有证明它能改善瓶颈。
- 自定义 Hook 直接访问 `window`、`document`、`localStorage`，在 SSR 下崩溃。
- 把表单库、RSC 边界、测试框架问题误当成 Hook 规则问题。表单/测试任务可联动 [javascript-typescript-jest](../../../javascript-expert/skills/javascript-typescript-jest/SKILL.md)。
