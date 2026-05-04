# CWV 代码模式与反模式

## LCP 优化

```html
<!-- LCP 图片：提前发现 + 高优先级 -->
<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">
<img
  src="/hero.webp"
  width="1440"
  height="900"
  fetchpriority="high"
  alt="产品主视觉"
>
```

```html
<!-- Modern format with fallback -->
<picture>
  <source srcset="/hero.avif" type="image/avif">
  <source srcset="/hero.webp" type="image/webp">
  <img src="/hero.jpg" width="1200" height="600" fetchpriority="high" alt="Hero">
</picture>
```

```css
/* 关键字体非阻塞加载 */
@font-face {
  font-family: 'Heading';
  src: url('/fonts/heading.woff2') format('woff2');
  font-display: swap;
}
```

```html
<!-- Inline critical CSS (< 14KB) -->
<head>
  <style>
    .hero { /* ... */ }
    .nav { /* ... */ }
  </style>
  <link rel="preload" href="/styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
</head>
```

## INP 优化

```js
// 把重任务拆片，避免一次性占满主线程
async function updateDashboard(chunks) {
  for (const chunk of chunks) {
    renderChunk(chunk);
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}
```

## CLS 优化

```css
/* 给媒体和广告位预留稳定空间 */
.hero-media { aspect-ratio: 16 / 9; width: 100%; }
```

## 反模式

### FAIL: LCP 图片懒加载
```html
<img src="/hero.webp" loading="lazy" alt="主视觉">
<!-- 浏览器发现晚 200-500ms，LCP 直接崩 -->
```

### PASS: 首屏图片高优先级
```html
<link rel="preload" as="image" href="/hero.webp" fetchpriority="high">
<img src="/hero.webp" fetchpriority="high" width="1440" height="900" alt="主视觉">
```

### FAIL: 点击事件同步大计算
```js
button.onclick = () => {
  const result = heavyCalc(items);  // 主线程卡 800ms
  updateUI(result);
};
```

### PASS: 拆片 + 让出主线程
```js
button.onclick = async () => {
  for (const chunk of chunks) {
    processChunk(chunk);
    await new Promise(r => requestAnimationFrame(r));
  }
};
```

### FAIL: 图片不声明尺寸
```html
<img src="/ad.jpg">  <!-- 加载完把下面内容顶开，CLS 飙升 -->
```

### PASS: aspect-ratio 预留空间
```css
.media { aspect-ratio: 16/9; width: 100%; }
```
