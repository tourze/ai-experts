# React Hooks 快速参考

## 状态与生命周期

```tsx
// State
const [value, setValue] = useState(initial);
setValue(newValue);           // 直接更新
setValue(prev => prev + 1);   // 函数式更新

// Reducer
const [state, dispatch] = useReducer(reducer, initialState);
dispatch({ type: 'ACTION' });

// Effect（渲染后执行）
useEffect(() => {
  // Effect 代码
  return () => { /* 清理 */ };
}, [dependencies]);

// Layout Effect（绘制前执行）
useLayoutEffect(() => { /* 测量 DOM */ }, []);
```

## 引用与上下文

```tsx
// DOM ref
const ref = useRef<HTMLElement>(null);
ref.current?.focus();

// 可变值（不触发重新渲染）
const count = useRef(0);
count.current++;

// Context
const value = useContext(MyContext);
```

## 性能

```tsx
// 缓存值
const computed = useMemo(() => expensiveFn(a, b), [a, b]);

// 缓存函数
const handler = useCallback((x) => doSomething(x, id), [id]);

// 非阻塞更新
const [isPending, startTransition] = useTransition();
startTransition(() => setSlowState(value));

// 延迟值
const deferred = useDeferredValue(value);
```

## Hook 规则

| 规则 | 正确做法 | 错误做法 |
|------|----------|----------|
| 仅在顶层调用 | 在组件 body 中调用 | 在 if/for/嵌套函数中调用 |
| 仅限 React 函数 | 组件、自定义 hook | 普通 JS 函数 |
| 保持一致顺序 | 每次渲染调用相同的 hooks | 条件式 hooks |

## 依赖数组

```tsx
[]        // 仅在挂载时执行一次
[a, b]    // 当 a 或 b 变化时执行
// 省略    // 每次渲染都执行（很少需要）
```

## 自定义 Hook 模板

```tsx
function useMyHook(param: string) {
  const [state, setState] = useState(null);

  useEffect(() => {
    // 使用 param 的 Effect
  }, [param]);

  const action = useCallback(() => {
    // 操作逻辑
  }, []);

  return { state, action };
}
```
