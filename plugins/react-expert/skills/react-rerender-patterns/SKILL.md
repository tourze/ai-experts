---
name: react-rerender-patterns
description: 当需要减少 React 不必要重渲染、优化 memo/state/effect 模式或处理 hooks 性能问题时使用。用户提到重渲染、memo、useMemo、useCallback、derived state、startTransition、useDeferredValue、effect 依赖 时触发。
---

# React 重渲染优化

## 适用场景

- 组件树存在不必要的重渲染，需要定位和消除。
- 需要决定是否使用 memo、useMemo、useCallback 及其正确姿势。
- 需要把 derived state 从 useEffect 迁移到渲染期计算。
- 需要用 startTransition / useDeferredValue 处理非紧急更新。
- 外部 store 订阅导致的重渲染，优先联动 [react-render-performance](../react-render-performance/SKILL.md)。
- 组件拆分层面可联动 [react-composable-components](../react-composable-components/SKILL.md)。
- 这套 skill 是规则索引；需要细节时直接打开对应 `rules/*.md` 文件。

## 核心约束

- 先确认重渲染是真实性能问题（Profiler 测量），再加 memo。
- derived state 在渲染期直接计算，不要用 useEffect + setState 做二次渲染。
- 不要在组件内部定义子组件，每次渲染都会创建新类型导致重新挂载。
- useRef 用于不需要触发渲染的瞬态值，不要用 useState。
- 简单原始类型表达式不需要 useMemo 包裹。

## 代码模式

```tsx
// FAIL — useEffect 里算 derived state，多一次渲染
const [items, setItems] = useState([]);
const [count, setCount] = useState(0);

useEffect(() => {
  setCount(items.length);
}, [items]);
```

```tsx
// PASS — 渲染期直接计算
const [items, setItems] = useState([]);
const count = items.length;
```

```tsx
// FAIL — 每次渲染重新创建组件
function Parent() {
  const Child = () => <div>inline</div>;
  return <Child />;
}
```

```tsx
// PASS — 组件定义提升到模块级
const Child = () => <div>stable</div>;

function Parent() {
  return <Child />;
}
```

```tsx
// PASS — 非紧急更新用 transition
import { startTransition } from 'react';

function SearchBox() {
  const [query, setQuery] = useState('');
  return (
    <input
      value={query}
      onChange={(e) => {
        startTransition(() => setQuery(e.target.value));
      }}
    />
  );
}
```

```md
规则文件索引：
- [rules/rerender-derived-state.md](rules/rerender-derived-state.md)
- [rules/rerender-derived-state-no-effect.md](rules/rerender-derived-state-no-effect.md)
- [rules/rerender-memo.md](rules/rerender-memo.md)
- [rules/rerender-memo-with-default-value.md](rules/rerender-memo-with-default-value.md)
- [rules/rerender-simple-expression-in-memo.md](rules/rerender-simple-expression-in-memo.md)
- [rules/rerender-no-inline-components.md](rules/rerender-no-inline-components.md)
- [rules/rerender-functional-setstate.md](rules/rerender-functional-setstate.md)
- [rules/rerender-lazy-state-init.md](rules/rerender-lazy-state-init.md)
- [rules/rerender-transitions.md](rules/rerender-transitions.md)
- [rules/rerender-use-deferred-value.md](rules/rerender-use-deferred-value.md)
- [rules/rerender-use-ref-transient-values.md](rules/rerender-use-ref-transient-values.md)
- [rules/rerender-defer-reads.md](rules/rerender-defer-reads.md)
- [rules/rerender-dependencies.md](rules/rerender-dependencies.md)
- [rules/rerender-move-effect-to-event.md](rules/rerender-move-effect-to-event.md)
- [rules/rerender-split-combined-hooks.md](rules/rerender-split-combined-hooks.md)
- [rules/advanced-effect-event-deps.md](rules/advanced-effect-event-deps.md)
- [rules/advanced-event-handler-refs.md](rules/advanced-event-handler-refs.md)
- [rules/advanced-init-once.md](rules/advanced-init-once.md)
- [rules/advanced-use-latest.md](rules/advanced-use-latest.md)
```

## 检查清单

- [ ] 是否先用 Profiler 确认了重渲染是真实瓶颈？
- [ ] derived state 是否在渲染期直接计算，而非 useEffect + setState？
- [ ] memo 组件的 props 是否引用稳定（无 inline object/function）？
- [ ] 是否避免了在组件内部定义子组件？
- [ ] 非紧急更新是否用 startTransition 或 useDeferredValue 处理？
- [ ] useRef 是否用于不需要触发渲染的值？
- [ ] 简单原始类型计算是否避免了不必要的 useMemo？

## 反模式

- 不测量就到处加 memo/useMemo/useCallback，增加复杂度但没有收益。
- 用 useEffect 监听 state A 来 setState B，制造级联渲染。
- 在渲染函数内部 `const Child = () => ...` 定义组件。
- 用户点击逻辑放进 useEffect 而不是事件处理器。
- 用 useState 存不需要触发渲染的值（计时器 ID、DOM 引用）。
