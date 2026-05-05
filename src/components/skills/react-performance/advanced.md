# React Performance Advanced Patterns

## 通用模式与反模式

### 列表虚拟化与稳定 props

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

### 懒加载重模块

```tsx
import { lazy, Suspense } from "react";

const HeavyChart = lazy(() => import("./HeavyChart"));

export function AnalyticsPanel({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <Suspense fallback={<div>Loading…</div>}>
      <HeavyChart />
    </Suspense>
  );
}
```

## 重渲染模式

### Derived state — 渲染期直算

```tsx
// FAIL — useEffect 算 derived state，多一次渲染
const [items, setItems] = useState([]);
const [count, setCount] = useState(0);
useEffect(() => { setCount(items.length); }, [items]);

// PASS — 渲染期直接计算
const [items, setItems] = useState([]);
const count = items.length;
```

### 不要在组件内定义子组件

```tsx
// FAIL — 每次渲染重建组件类型，子树重新挂载
function Parent() {
  const Child = () => <div>inline</div>;
  return <Child />;
}

// PASS — 提升到模块级
const Child = () => <div>stable</div>;
function Parent() { return <Child />; }
```

### 非紧急更新走 transition

```tsx
import { startTransition } from 'react';

function SearchBox() {
  const [query, setQuery] = useState('');
  return (
    <input value={query}
      onChange={(e) => startTransition(() => setQuery(e.target.value))}
    />
  );
}
```

更细粒度的规则（含 `useDeferredValue`、`useRef` 瞬态值、effect 依赖、event handler refs 等）见 `rules/` 目录。

## Store 订阅

### 叶子节点订阅最小 slice

```tsx
// FAIL — 整份 store
function App() {
  const state = useStore();
  return <Layout user={state.user} cart={state.cart} />;
}

// PASS — 叶子各自订阅自己的字段
function UserAvatar() {
  const avatar = useStore(s => s.user.avatar);
  return <img src={avatar} />;
}
function CartCount() {
  const count = useStore(s => s.cart.items.length);
  return <span>{count}</span>;
}
```

### Selector 返回多字段需 shallowEqual

```tsx
import { shallowEqual, useSelector } from "react-redux";

// FAIL — 每次新对象，永远 ≠
const { phase, step } = useSelector(s => ({ phase: s.session.phase, step: s.session.step }));

// PASS
const { phase, step } = useSelector(
  s => ({ phase: s.session.phase, step: s.session.step }),
  shallowEqual,
);
```

### Computed store / 派生

```tsx
import { atom, computed } from "nanostores";
import { useStore } from "@nanostores/react";

const $session = atom({ phase: "idle", step: 0 });
const $phase = computed($session, (s) => s.phase);

export function PhaseLabel() {
  const phase = useStore($phase);
  return <span>{phase}</span>;
}
```

### Context value 稳定

```tsx
// FAIL — 父组件每次 render 都新建对象，所有 consumer 重跑
<MyContext.Provider value={{ user, theme, toggle: () => setTheme(...) }}>

// PASS
const value = useMemo(() => ({ user, theme, toggle }), [user, theme, toggle]);
<MyContext.Provider value={value}>
```

## Anti-patterns

### 父组件破坏 memo

```tsx
// FAIL
function Parent() {
  return (
    <MemoizedChild
      style={{ color: "red" }}             // 新对象
      onClick={() => handleClick()}         // 新函数
      items={data.filter(x => x.active)}   // 新数组
    />
  );
}

// PASS
function Parent() {
  const style = useMemo(() => ({ color: "red" }), []);
  const onClick = useCallback(() => handleClick(), []);
  const activeItems = useMemo(() => data.filter(x => x.active), [data]);
  return <MemoizedChild style={style} onClick={onClick} items={activeItems} />;
}
```

### Render 内原地 mutate

```tsx
// FAIL — 修改了 props
function SortedList({ items }: { items: Item[] }) {
  items.sort((a, b) => a.name.localeCompare(b.name));
  return <ul>{items.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
}

// PASS — 复制后排序
function SortedList({ items }: { items: Item[] }) {
  const sorted = useMemo(() => [...items].sort(/* … */), [items]);
  return <ul>{sorted.map(i => <li key={i.id}>{i.name}</li>)}</ul>;
}
```

### 不测量乱加 memo

```tsx
// FAIL — 简单原始类型计算包 useMemo，毫无收益
const val = useMemo(() => a + b, [a, b]);

// PASS — Profiler 驱动
// React DevTools → Ranked → 找 > 16ms 的组件 → 针对性 memo
```

### 误判性能问题

- 列表性能差却不做虚拟化，靠"拆组件 + 加 memo"硬撑。
- 把测试慢、网络慢、服务端慢误判成 React 渲染慢。

## Profiling

### React DevTools Profiler

```tsx
// Add Profiler component
import { Profiler } from 'react';

function onRender(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
  baseDuration: number,
  startTime: number,
  commitTime: number
) {
  console.log({
    id,
    phase,
    actualDuration,
    baseDuration,
  });
}

function App() {
  return (
    <Profiler id="App" onRender={onRender}>
      <Dashboard />
    </Profiler>
  );
}
```

### Custom Performance Hooks

```tsx
function useRenderCount(componentName: string) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    console.log(`${componentName} rendered ${renderCount.current} times`);
  });
}

function useWhyDidYouUpdate(name: string, props: Record<string, unknown>) {
  const previousProps = useRef<Record<string, unknown>>();

  useEffect(() => {
    if (previousProps.current) {
      const allKeys = Object.keys({ ...previousProps.current, ...props });
      const changedProps: Record<string, { from: unknown; to: unknown }> = {};

      allKeys.forEach(key => {
        if (previousProps.current![key] !== props[key]) {
          changedProps[key] = {
            from: previousProps.current![key],
            to: props[key],
          };
        }
      });

      if (Object.keys(changedProps).length) {
        console.log('[why-did-you-update]', name, changedProps);
      }
    }

    previousProps.current = props;
  });
}

// Usage
function MyComponent(props: Props) {
  useRenderCount('MyComponent');
  useWhyDidYouUpdate('MyComponent', props);

  return <div>...</div>;
}
```

---

## Bundle Optimization

### Tree Shaking

```tsx
// ❌ Bad: Imports entire library
import _ from 'lodash';
const result = _.debounce(fn, 300);

// ✅ Good: Import only what you need
import debounce from 'lodash/debounce';
const result = debounce(fn, 300);

// ✅ Good: Use lodash-es for better tree shaking
import { debounce } from 'lodash-es';
```

### Dynamic Imports

```tsx
// Load heavy dependencies only when needed
async function handleExport() {
  const xlsx = await import('xlsx');
  const workbook = xlsx.utils.book_new();
  // ...
}

// Load polyfills conditionally
if (!window.IntersectionObserver) {
  await import('intersection-observer');
}
```

### Vite/Webpack Configuration

```ts
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          charts: ['recharts'],
        },
      },
    },
  },
});
```

---

## Image Optimization

```tsx
// Lazy loading images
function LazyImage({ src, alt, ...props }: ImgHTMLAttributes<HTMLImageElement>) {
  return <img src={src} alt={alt} loading="lazy" {...props} />;
}

// With placeholder
function OptimizedImage({ src, placeholder, alt }: Props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="image-container">
      {!loaded && <img src={placeholder} alt="" className="placeholder" />}
      <img
        src={src}
        alt={alt}
        onLoad={() => setLoaded(true)}
        className={loaded ? 'visible' : 'hidden'}
      />
    </div>
  );
}

// With Intersection Observer
function LazyLoadImage({ src, alt }: Props) {
  const ref = useRef<HTMLImageElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (ref.current) observer.observe(ref.current);

    return () => observer.disconnect();
  }, []);

  return (
    <img
      ref={ref}
      src={isVisible ? src : undefined}
      data-src={src}
      alt={alt}
    />
  );
}
```

---

## Web Workers

Offload heavy computations:

```tsx
// worker.ts
self.onmessage = (event) => {
  const { data, type } = event.data;

  if (type === 'PROCESS_DATA') {
    const result = heavyComputation(data);
    self.postMessage({ type: 'RESULT', result });
  }
};

// Component
function DataProcessor({ data }: { data: Data[] }) {
  const [result, setResult] = useState<Result | null>(null);
  const workerRef = useRef<Worker>();

  useEffect(() => {
    workerRef.current = new Worker(
      new URL('./worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (event) => {
      if (event.data.type === 'RESULT') {
        setResult(event.data.result);
      }
    };

    return () => workerRef.current?.terminate();
  }, []);

  const processData = () => {
    workerRef.current?.postMessage({ type: 'PROCESS_DATA', data });
  };

  return (
    <div>
      <button onClick={processData}>Process</button>
      {result && <ResultDisplay result={result} />}
    </div>
  );
}
```
