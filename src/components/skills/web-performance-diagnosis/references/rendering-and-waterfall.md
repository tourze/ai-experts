# 瀑布流消除与浏览器渲染模式

## 瀑布流消除

### 核心原则

- 先画数据依赖图，有真实依赖的请求才串行。
- 便宜条件（缓存命中、feature flag、权限）放在 await 之前。
- 不要把所有 await 塞进一个 Promise.all — 有依赖的仍需串行。
- Suspense 边界包裹独立数据源，不要包裹整个页面。

### 代码模式

```typescript
// FAIL — 串行 3 次网络请求
const user = await fetchUser();
const posts = await fetchPosts();
const comments = await fetchComments();
```

```typescript
// PASS — 并行执行
const [user, posts, comments] = await Promise.all([
  fetchUser(),
  fetchPosts(),
  fetchComments(),
]);
```

```typescript
// PASS — 有依赖关系时只串行必要的部分
const user = await fetchUser();
const [posts, followers] = await Promise.all([
  fetchPostsByUser(user.id),
  fetchFollowers(user.id),
]);
```

### 反模式

#### FAIL: 混依赖的 Promise.all

```ts
const [user, posts] = await Promise.all([
  fetchUser(),
  fetchPostsByUser(currentUser.id),  // currentUser 还没拿到
]);
```

#### PASS: 仅必要部分串行

```ts
const user = await fetchUser();
const [posts, followers] = await Promise.all([
  fetchPostsByUser(user.id),
  fetchFollowers(user.id),
]);
```

### 规则索引

- [rules-waterfall/async-parallel.md](./rules-waterfall/async-parallel.md)
- [rules-waterfall/async-defer-await.md](./rules-waterfall/async-defer-await.md)
- [rules-waterfall/async-dependencies.md](./rules-waterfall/async-dependencies.md)
- [rules-waterfall/async-cheap-condition-before-await.md](./rules-waterfall/async-cheap-condition-before-await.md)
- [rules-waterfall/async-api-routes.md](./rules-waterfall/async-api-routes.md)
- [rules-waterfall/async-suspense-boundaries.md](./rules-waterfall/async-suspense-boundaries.md)

## 浏览器渲染模式

### Hydration

```tsx
// FAIL — hydration mismatch 导致闪烁
function Timestamp() {
  return <span>{new Date().toLocaleString()}</span>;
}
```

```tsx
// PASS — 双阶段渲染避免闪烁
function Timestamp() {
  const [time, setTime] = useState<string>();
  useEffect(() => {
    setTime(new Date().toLocaleString());
  }, []);
  if (!time) return <span className="placeholder" />;
  return <span>{time}</span>;
}
```

#### FAIL: typeof window 条件渲染

```tsx
function Time() {
  if (typeof window !== 'undefined') {
    return <span>{new Date().toLocaleString()}</span>;
  }
  return null;
}
// SSR: null → CSR: 时间 → hydration 闪烁
```

#### PASS: useEffect 双阶段

```tsx
function Time() {
  const [time, setTime] = useState<string>();
  useEffect(() => setTime(new Date().toLocaleString()), []);
  return <span>{time ?? <span className="placeholder"/>}</span>;
}
```

### Resource Hints

```tsx
// PASS — resource hints 加速关键资源
import { preconnect, preload } from 'react-dom';

export default function RootLayout({ children }) {
  preconnect('https://api.example.com');
  preload('/fonts/inter.woff2', {
    as: 'font',
    type: 'font/woff2',
    crossOrigin: 'anonymous',
  });
  return <html><body>{children}</body></html>;
}
```

#### FAIL: 全部 preload

```html
<link rel="preload" href="/hero.webp" as="image">
<link rel="preload" href="/logo.svg" as="image">
<link rel="preload" href="/footer.png" as="image">
<!-- 10+ 资源争抢带宽 → LCP 反而变慢 -->
```

#### PASS: 仅 LCP 关键资源

```html
<link rel="preload" href="/hero.webp" as="image" fetchpriority="high">
<link rel="preconnect" href="https://api.example.com">
```

### Event Listeners

```typescript
// PASS — passive event listener
element.addEventListener('scroll', handler, { passive: true });
```

### 规则索引

- [rules-rendering/rendering-hydration-no-flicker.md](./rules-rendering/rendering-hydration-no-flicker.md)
- [rules-rendering/rendering-hydration-suppress-warning.md](./rules-rendering/rendering-hydration-suppress-warning.md)
- [rules-rendering/rendering-resource-hints.md](./rules-rendering/rendering-resource-hints.md)
- [rules-rendering/rendering-content-visibility.md](./rules-rendering/rendering-content-visibility.md)
- [rules-rendering/rendering-script-defer-async.md](./rules-rendering/rendering-script-defer-async.md)
- [rules-rendering/rendering-hoist-jsx.md](./rules-rendering/rendering-hoist-jsx.md)
- [rules-rendering/rendering-conditional-render.md](./rules-rendering/rendering-conditional-render.md)
- [rules-rendering/rendering-activity.md](./rules-rendering/rendering-activity.md)
- [rules-rendering/rendering-animate-svg-wrapper.md](./rules-rendering/rendering-animate-svg-wrapper.md)
- [rules-rendering/rendering-svg-precision.md](./rules-rendering/rendering-svg-precision.md)
- [rules-rendering/rendering-usetransition-loading.md](./rules-rendering/rendering-usetransition-loading.md)
- [rules-rendering/client-event-listeners.md](./rules-rendering/client-event-listeners.md)
- [rules-rendering/client-passive-event-listeners.md](./rules-rendering/client-passive-event-listeners.md)
- [rules-rendering/client-swr-dedup.md](./rules-rendering/client-swr-dedup.md)
- [rules-rendering/client-localstorage-schema.md](./rules-rendering/client-localstorage-schema.md)
