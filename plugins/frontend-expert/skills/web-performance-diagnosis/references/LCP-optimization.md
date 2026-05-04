# LCP 优化参考

## 什么是 LCP？

Largest Contentful Paint（LCP）衡量视口中最大内容元素变为可见的时间点。典型元素包括：

- `<img>` 元素
- `<svg>` 内的 `<image>` 元素
- 带有 poster 图片的 `<video>` 元素
- 通过 `url()` 设置背景图片的元素
- 包含文本节点的块级元素

## LCP 时间线

```
[  服务器响应  ][  资源加载  ][  渲染  ]
       TTFB          下载         绘制
       └─────────────────────────────────┘
                      LCP 时间
```

## 详细优化策略

### 1. 服务器响应时间（TTFB）

目标：< 800ms

**常见原因：**
- 服务器/数据库查询慢
- 缺少 CDN / 边缘缓存
- 后端代码效率低
- 冷启动（Serverless 场景）

**解决方案：**
```javascript
// 对动态内容使用边缘函数
// Vercel 示例
export const config = { runtime: 'edge' };

// 使用 stale-while-revalidate 缓存策略
// Cache-Control 响应头
res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
```

### 2. 资源加载时间

**图片优化：**
```html
<!-- 预加载 LCP 图片 -->
<link rel="preload" as="image" href="/hero.webp" 
      imagesrcset="/hero-400.webp 400w, /hero-800.webp 800w"
      imagesizes="100vw"
      fetchpriority="high">

<!-- 现代格式 + 降级回退 -->
<picture>
  <source srcset="/hero.avif" type="image/avif">
  <source srcset="/hero.webp" type="image/webp">
  <img src="/hero.jpg" width="1200" height="600" 
       fetchpriority="high" alt="Hero">
</picture>
```

**文本（Web 字体）：**
```css
@font-face {
  font-family: 'Heading';
  src: url('/fonts/heading.woff2') format('woff2');
  font-display: swap; /* 立即显示降级字体 */
}
```

### 3. 渲染阻塞资源

**关键 CSS 模式：**
```html
<head>
  <!-- 内联关键 CSS -->
  <style>
    /* 仅首屏样式，控制在 14KB 以内 */
    .hero { /* ... */ }
    .nav { /* ... */ }
  </style>
  
  <!-- 延迟加载非关键 CSS -->
  <link rel="preload" href="/styles.css" as="style" 
        onload="this.onload=null;this.rel='stylesheet'">
</head>
```

**延迟 JavaScript：**
```html
<!-- ❌ 阻塞 HTML 解析 -->
<script src="/app.js"></script>

<!-- ✅ defer（HTML 解析完成后执行） -->
<script defer src="/app.js"></script>

<!-- ✅ ES Module（默认 defer） -->
<script type="module" src="/app.mjs"></script>
```

### 4. 客户端渲染问题

**问题：** 首次 HTML 中不包含实际内容。

**解决方案：**

**服务端渲染（SSR）：**
```javascript
// Next.js
export async function getServerSideProps() {
  const data = await fetchHeroContent();
  return { props: { hero: data } };
}
```

**静态站点生成（SSG）：**
```javascript
// Next.js
export async function getStaticProps() {
  const data = await fetchHeroContent();
  return { props: { hero: data }, revalidate: 3600 };
}
```

**流式 SSR：**
```jsx
// React 18+
import { Suspense } from 'react';

function Page() {
  return (
    <Suspense fallback={<HeroSkeleton />}>
      <Hero />
    </Suspense>
  );
}
```

## 框架专项建议

### Next.js
```jsx
import Image from 'next/image';

// 为 LCP 图片设置 priority
<Image 
  src="/hero.jpg"
  priority
  fill
  sizes="100vw"
  alt="Hero"
/>
```

### Nuxt
```vue
<NuxtImg
  src="/hero.jpg"
  preload
  loading="eager"
  sizes="100vw"
/>
```

### Astro
```astro
---
import { Image } from 'astro:assets';
import hero from '../assets/hero.jpg';
---
<Image 
  src={hero} 
  loading="eager" 
  decoding="sync"
  alt="Hero" 
/>
```

## 调试 LCP

```javascript
// 识别 LCP 元素
new PerformanceObserver((entryList) => {
  const entries = entryList.getEntries();
  const lastEntry = entries[entries.length - 1];
  
  console.log('LCP:', {
    element: lastEntry.element,
    time: lastEntry.startTime,
    size: lastEntry.size,
    url: lastEntry.url,
    renderTime: lastEntry.renderTime,
    loadTime: lastEntry.loadTime
  });
}).observe({ type: 'largest-contentful-paint', buffered: true });
```

## 常见问题速查

| 问题 | 影响 | 修复方式 |
|------|------|----------|
| 未预加载 LCP 图片 | +500–1000ms | 添加 `<link rel="preload">` |
| 大图未优化 | +300–800ms | 压缩，使用 WebP/AVIF 格式 |
| CSS 阻塞渲染 | +200–500ms | 内联关键 CSS |
| TTFB 过慢 | +300–2000ms | 接入 CDN、边缘缓存 |
| 内容纯客户端渲染 | +500–2000ms | 改用 SSR/SSG |
