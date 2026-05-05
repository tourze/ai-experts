---
title: 使用 React DOM 资源提示
impact: HIGH
impactDescription: 减少关键资源加载时间
tags: rendering, preload, preconnect, prefetch, resource-hints
---

## 使用 React DOM 资源提示

**影响：HIGH（减少关键资源加载时间）**

React DOM 提供了向浏览器提示即将需要的资源的 API。在 Server Component 中使用时，可以在客户端收到 HTML 之前就开始加载资源。

- **`prefetchDNS(href)`**：提前解析域名的 DNS
- **`preconnect(href)`**：提前建立连接（DNS + TCP + TLS）
- **`preload(href, options)`**：预加载即将用到的资源（样式、字体、脚本、图片）
- **`preloadModule(href)`**：预加载即将用到的 ES module
- **`preinit(href, options)`**：预加载并执行样式或脚本
- **`preinitModule(href)`**：预加载并执行 ES module

**示例（预连接第三方 API）：**

```tsx
import { preconnect, prefetchDNS } from 'react-dom'

export default function App() {
  prefetchDNS('https://analytics.example.com')
  preconnect('https://api.example.com')

  return <main>{/* content */}</main>
}
```

**示例（预加载关键字体和样式）：**

```tsx
import { preload, preinit } from 'react-dom'

export default function RootLayout({ children }) {
  // 预加载字体文件
  preload('/fonts/inter.woff2', { as: 'font', type: 'font/woff2', crossOrigin: 'anonymous' })

  // 立即获取并应用关键样式
  preinit('/styles/critical.css', { as: 'style' })

  return (
    <html>
      <body>{children}</body>
    </html>
  )
}
```

**示例（为代码分割的路由预加载模块）：**

```tsx
import { preloadModule, preinitModule } from 'react-dom'

function Navigation() {
  const preloadDashboard = () => {
    preloadModule('/dashboard.js', { as: 'script' })
  }

  return (
    <nav>
      <a href="/dashboard" onMouseEnter={preloadDashboard}>
        Dashboard
      </a>
    </nav>
  )
}
```

**各 API 适用场景：**

| API | 适用场景 |
|-----|----------|
| `prefetchDNS` | 稍后会连接的第三方域名 |
| `preconnect` | 立即需要请求的 API 或 CDN |
| `preload` | 当前页面需要的关键资源 |
| `preloadModule` | 可能下一步导航用到的 JS 模块 |
| `preinit` | 必须尽早执行的样式/脚本 |
| `preinitModule` | 必须尽早执行的 ES module |

参考：[React DOM 资源预加载 API](https://react.dev/reference/react-dom#resource-preloading-apis)
