---
title: 无闪烁地防止 Hydration 不匹配
impact: MEDIUM
impactDescription: 避免视觉闪烁和 hydration 错误
tags: rendering, ssr, hydration, localStorage, flicker
---

## 无闪烁地防止 Hydration 不匹配

当渲染依赖客户端存储（localStorage、cookie）的内容时，通过注入同步脚本来在 React hydrate 之前更新 DOM，同时避免 SSR 崩溃和 hydration 后闪烁。

**错误（破坏 SSR）：**

```tsx
function ThemeWrapper({ children }: { children: ReactNode }) {
  // 服务端没有 localStorage — 抛出异常
  const theme = localStorage.getItem('theme') || 'light'

  return (
    <div className={theme}>
      {children}
    </div>
  )
}
```

服务端渲染会因 `localStorage` 未定义而失败。

**错误（视觉闪烁）：**

```tsx
function ThemeWrapper({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    // hydration 之后才执行 — 导致可见闪烁
    const stored = localStorage.getItem('theme')
    if (stored) {
      setTheme(stored)
    }
  }, [])

  return (
    <div className={theme}>
      {children}
    </div>
  )
}
```

组件先用默认值（`light`）渲染，hydration 后再更新，导致可见的错误内容闪烁。

**正确（无闪烁，无 hydration 不匹配）：**

```tsx
function ThemeWrapper({ children }: { children: ReactNode }) {
  return (
    <>
      <div id="theme-wrapper">
        {children}
      </div>
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('theme') || 'light';
                var el = document.getElementById('theme-wrapper');
                if (el) el.className = theme;
              } catch (e) {}
            })();
          `,
        }}
      />
    </>
  )
}
```

内联脚本在元素显示之前同步执行，确保 DOM 已有正确的值。无闪烁，无 hydration 不匹配。

此模式特别适用于主题切换、用户偏好、认证状态，以及任何应在客户端立即可用且不应闪烁默认值的数据。
