---
name: browser-rendering-patterns
description: 当用户要解决 hydration、浏览器渲染性能、resource hints 或客户端事件处理问题时使用。
---

# 浏览器渲染模式

## 适用场景

- 需要解决 SSR hydration 不匹配导致的闪烁或警告。
- 需要用 content-visibility、script defer/async 等浏览器原生能力优化渲染。
- 需要用 resource hints（preload、preconnect、prefetchDNS）加速关键资源加载。
- 需要优化客户端事件监听（passive listeners、全局事件去重、localStorage 管理）。
- 性能指标层面可联动 [core-web-vitals](../core-web-vitals/SKILL.md)。
- 这套 skill 是规则索引；需要细节时直接打开对应 `rules/*.md` 文件。

## 核心约束

- Hydration 修复不能引入视觉闪烁 — 用 suppressHydrationWarning 或双阶段渲染。
- content-visibility: auto 只用于视口外的长列表或低优先级区域。
- Resource hints 只预加载高概率路径上的关键资源，不要预加载所有可能资源。
- scroll/resize 事件必须用 passive: true，否则阻塞主线程。

## 代码模式

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

```typescript
// PASS — passive event listener
element.addEventListener('scroll', handler, { passive: true });
```

```md
规则文件索引：
- [rules/rendering-hydration-no-flicker.md](rules/rendering-hydration-no-flicker.md)
- [rules/rendering-hydration-suppress-warning.md](rules/rendering-hydration-suppress-warning.md)
- [rules/rendering-resource-hints.md](rules/rendering-resource-hints.md)
- [rules/rendering-content-visibility.md](rules/rendering-content-visibility.md)
- [rules/rendering-script-defer-async.md](rules/rendering-script-defer-async.md)
- [rules/rendering-hoist-jsx.md](rules/rendering-hoist-jsx.md)
- [rules/rendering-conditional-render.md](rules/rendering-conditional-render.md)
- [rules/rendering-activity.md](rules/rendering-activity.md)
- [rules/rendering-animate-svg-wrapper.md](rules/rendering-animate-svg-wrapper.md)
- [rules/rendering-svg-precision.md](rules/rendering-svg-precision.md)
- [rules/rendering-usetransition-loading.md](rules/rendering-usetransition-loading.md)
- [rules/client-event-listeners.md](rules/client-event-listeners.md)
- [rules/client-passive-event-listeners.md](rules/client-passive-event-listeners.md)
- [rules/client-swr-dedup.md](rules/client-swr-dedup.md)
- [rules/client-localstorage-schema.md](rules/client-localstorage-schema.md)
```

## 检查清单

- [ ] SSR hydration 是否无闪烁、无控制台警告？
- [ ] 长列表或视口外区域是否使用了 content-visibility: auto？
- [ ] script 标签是否使用了 defer 或 async？
- [ ] 关键第三方域名是否做了 preconnect / prefetchDNS？
- [ ] scroll/resize/touchmove 事件是否加了 passive: true？
- [ ] 全局事件监听是否做了去重，避免重复注册？
- [ ] SVG 是否精简了小数位数和冗余属性？

## 反模式

### FAIL: typeof window 条件渲染

```tsx
function Time() {
  if (typeof window !== 'undefined') {
    return <span>{new Date().toLocaleString()}</span>;
  }
  return null;
}
// SSR: null → CSR: 时间 → hydration 闪烁
```

### PASS: useEffect 双阶段

```tsx
function Time() {
  const [time, setTime] = useState<string>();
  useEffect(() => setTime(new Date().toLocaleString()), []);
  return <span>{time ?? <span className="placeholder"/>}</span>;
}
```

### FAIL: 全部 preload

```html
<link rel="preload" href="/hero.webp" as="image">
<link rel="preload" href="/logo.svg" as="image">
<link rel="preload" href="/footer.png" as="image">
<!-- 10+ 资源争抢带宽 → LCP 反而变慢 -->
```

### PASS: 仅 LCP 关键资源

```html
<link rel="preload" href="/hero.webp" as="image" fetchpriority="high">
<!-- 其他图片懒加载 / DNS-prefetch 第三方域名 -->
<link rel="preconnect" href="https://api.example.com">
```
