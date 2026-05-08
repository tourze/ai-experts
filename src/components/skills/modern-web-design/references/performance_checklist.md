# Web 性能优化清单

## 概览

面向 Core Web Vitals 和 60 FPS 体验的综合性能优化指南。本清单涵盖测量、优化策略和现代最佳实践。

**性能预算目标**：
- Largest Contentful Paint (LCP)：< 2.5s
- First Input Delay (FID)：< 100ms
- Cumulative Layout Shift (CLS)：< 0.1
- Interaction to Next Paint (INP)：< 200ms
- Time to Interactive (TTI)：< 3.8s
- First Contentful Paint (FCP)：< 1.8s

---

## 目录

1. [Core Web Vitals](#core-web-vitals)
2. [动画性能](#动画性能)
3. [图片优化](#图片优化)
4. [字体加载](#字体加载)
5. [JavaScript 优化](#javascript-优化)
6. [CSS 优化](#css-优化)
7. [3D 与 WebGL 优化](#3d-与-webgl-优化)
8. [加载策略](#加载策略)
9. [缓存与 CDN](#缓存与-cdn)
10. [监控与测量](#监控与测量)

---

## Core Web Vitals

### Largest Contentful Paint (LCP)

**目标**：< 2.5 秒

**测量内容**：最大内容元素可见所需的时间。

**优化清单**：
- [ ] 优化首屏图片（WebP/AVIF，< 100KB）
- [ ] 预加载关键资源（`<link rel="preload">`）
- [ ] 消除渲染阻塞资源
- [ ] 对静态资源使用 CDN
- [ ] 实现高效的服务端响应时间（TTFB < 200ms）
- [ ] 移除未使用的 CSS/JS
- [ ] 启用压缩（Brotli/gzip）

**实现**：
```html
<!-- Preload critical resources -->
<link rel="preload" as="image" href="hero.webp" type="image/webp">
<link rel="preload" as="font" href="inter-var.woff2" type="font/woff2" crossorigin>

<!-- Modern image formats -->
<picture>
  <source srcset="hero.avif" type="image/avif">
  <source srcset="hero.webp" type="image/webp">
  <img src="hero.jpg" alt="Hero" loading="eager" fetchpriority="high">
</picture>
```

**调试**：
```javascript
// Measure LCP
new PerformanceObserver((list) => {
  const entries = list.getEntries();
  const lastEntry = entries[entries.length - 1];
  console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
}).observe({ entryTypes: ['largest-contentful-paint'] });
```

---

### First Input Delay (FID) / Interaction to Next Paint (INP)

**目标**：FID < 100ms, INP < 200ms

**测量内容**：用户交互的响应速度。

**优化清单**：
- [ ] 拆分长任务（每次 < 50ms）
- [ ] 延迟加载非关键 JavaScript
- [ ] 对重型计算使用 Web Worker
- [ ] 实现代码拆分
- [ ] 避免长时间运行的事件处理函数
- [ ] 对滚动/调整大小事件监听器进行防抖
- [ ] 使用被动事件监听器

**实现**：
```javascript
// Split long tasks
function yieldToMain() {
  return new Promise(resolve => {
    setTimeout(resolve, 0);
  });
}

async function processLargeArray(array) {
  for (let i = 0; i < array.length; i++) {
    processItem(array[i]);

    // Yield every 50 items
    if (i % 50 === 0) {
      await yieldToMain();
    }
  }
}

// Passive event listeners
window.addEventListener('scroll', handleScroll, { passive: true });

// Debounced resize handler
const debouncedResize = debounce(() => {
  handleResize();
}, 150);

window.addEventListener('resize', debouncedResize);
```

---

### Cumulative Layout Shift (CLS)

**目标**：< 0.1

**测量内容**：页面加载过程中的视觉稳定性。

**优化清单**：
- [ ] 为图片预留空间（使用 `aspect-ratio`）
- [ ] 为广告和嵌入内容预留空间
- [ ] 避免在现有内容上方插入内容
- [ ] 使用 CSS transforms 代替位置变化
- [ ] 为 iframe 设置显式尺寸
- [ ] 避免使用会导致 FOUT/FOIT 的网页字体
- [ ] 使用 `font-display: swap` 或 `font-display: optional`

**实现**：
```css
/* Reserve space for images */
img {
  aspect-ratio: attr(width) / attr(height);
  width: 100%;
  height: auto;
}

/* Or explicit aspect ratio */
.hero-image {
  aspect-ratio: 16 / 9;
}

/* Animations: use transform, not position */
.animated {
  transform: translateX(0);
  transition: transform 0.3s;
}

.animated.active {
  transform: translateX(100px); /* Good */
  /* left: 100px; Bad - causes layout shift */
}
```

**调试**：
```javascript
// Measure CLS
let clsValue = 0;
new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (!entry.hadRecentInput) {
      clsValue += entry.value;
      console.log('CLS:', clsValue);
    }
  }
}).observe({ entryTypes: ['layout-shift'] });
```

---

## 动画性能

### 60 FPS 清单

**目标**：每帧 < 16.67ms

**GPU 加速属性（优先使用）**：
- `transform`（translate、scale、rotate）
- `opacity`
- `filter`（部分属性如 blur 需谨慎使用）

**避免动画化的属性**：
- `top`、`left`、`right`、`bottom`
- `width`、`height`
- `margin`、`padding`
- `border-width`

**实现**：
```css
/* Good: GPU-accelerated */
.animated {
  transform: translateX(0);
  opacity: 1;
  transition: transform 0.3s, opacity 0.3s;
}

.animated.active {
  transform: translateX(100px) scale(1.1);
  opacity: 0.8;
}

/* Bad: triggers layout/paint */
.animated-bad {
  left: 0;
  width: 100px;
  transition: left 0.3s, width 0.3s;
}
```

### Will-Change 优化

**谨慎使用**：
```css
/* Only during animation */
.will-animate {
  /* Don't set will-change here */
}

.will-animate.animating {
  will-change: transform; /* Set on animation start */
}

.will-animate.done {
  will-change: auto; /* Remove after animation */
}
```

**JavaScript 控制**：
```javascript
element.addEventListener('mouseenter', () => {
  element.style.willChange = 'transform';
});

element.addEventListener('mouseleave', () => {
  element.addEventListener('transitionend', () => {
    element.style.willChange = 'auto';
  }, { once: true });
});
```

### RequestAnimationFrame

**始终用于 JavaScript 动画**：
```javascript
// Good
function animate() {
  element.style.transform = `translateX(${x}px)`;
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// Bad
setInterval(() => {
  element.style.transform = `translateX(${x}px)`;
}, 16); // Not synced with browser paint
```

### 性能监控

**Chrome DevTools**：
```javascript
performance.mark('anim-start');
// ... animation work ...
performance.mark('anim-end');
performance.measure('anim-duration', 'anim-start', 'anim-end');
const m = performance.getEntriesByName('anim-duration')[0];
console.log(`Animation took ${m.duration}ms`);
```

---

## 图片优化

### 格式选择

**决策树**：
1. **照片**：AVIF > WebP > JPEG
2. **图形/Logo**：SVG > WebP > PNG
3. **动图**：WebP 动图 > GIF
4. **图标**：SVG 或图标字体

**实现**：
```html
<picture>
  <!-- Modern browsers: AVIF (best compression) -->
  <source srcset="image.avif" type="image/avif">

  <!-- Fallback: WebP (good compression) -->
  <source srcset="image.webp" type="image/webp">

  <!-- Final fallback: JPEG -->
  <img src="image.jpg" alt="Description" loading="lazy">
</picture>
```

### 响应式图片

**清单**：
- [ ] 使用 `srcset` 提供多分辨率
- [ ] 定义 `sizes` 属性
- [ ] 提供适当尺寸的图片（不在所有场景使用全分辨率）
- [ ] 对首屏以下的图片使用懒加载
- [ ] 设置显式尺寸以防止 CLS

**实现**：
```html
<img
  src="image-800.jpg"
  srcset="
    image-400.jpg 400w,
    image-800.jpg 800w,
    image-1200.jpg 1200w,
    image-1600.jpg 1600w
  "
  sizes="
    (max-width: 640px) 100vw,
    (max-width: 1024px) 50vw,
    33vw
  "
  alt="Description"
  loading="lazy"
  width="1200"
  height="800"
>
```

### 图片压缩

**工具**：
- **CLI**：ImageMagick、Sharp（Node.js）
- **GUI**：Squooh（Web）、ImageOptim（Mac）
- **构建工具**：imagemin、@squoosh/lib

**示例（Sharp）**：
```javascript
const sharp = require('sharp');

await sharp('input.jpg')
  .resize(1200, 800, { fit: 'cover' })
  .webp({ quality: 80 })
  .toFile('output.webp');

await sharp('input.jpg')
  .resize(1200, 800, { fit: 'cover' })
  .avif({ quality: 70 })
  .toFile('output.avif');
```

### 懒加载

**原生懒加载**：
```html
<!-- Lazy load below-fold images -->
<img src="image.jpg" loading="lazy" alt="Description">

<!-- Eager load above-fold images -->
<img src="hero.jpg" loading="eager" fetchpriority="high" alt="Hero">
```

**Intersection Observer（高级）**：
```javascript
const imageObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      img.classList.remove('lazy');
      observer.unobserve(img);
    }
  });
});

document.querySelectorAll('img[data-src]').forEach(img => {
  imageObserver.observe(img);
});
```

---

## 字体加载

### Font-Display 策略

**选项**：
- `swap`：立即显示后备字体，加载完成后替换（FOUT — 未样式文本闪烁）
- `optional`：使用缓存字体（如果可用），否则使用后备字体
- `fallback`：短暂阻塞，快速加载则替换，加载慢则使用后备字体

**推荐做法**：
```css
@font-face {
  font-family: 'Inter';
  src: url('/fonts/inter-var.woff2') format('woff2-variations');
  font-weight: 100 900;
  font-display: swap; /* Show fallback immediately */
}
```

### 字体子集化

**仅包含所需字符以减小文件体积**：

**工具**：`pyftsubset`（fonttools 工具）

```bash
# Include only Latin characters
pyftsubset input.ttf \
  --output-file=output.woff2 \
  --flavor=woff2 \
  --layout-features=* \
  --unicodes=U+0000-00FF
```

### 预加载关键字体

```html
<link
  rel="preload"
  as="font"
  href="/fonts/inter-var.woff2"
  type="font/woff2"
  crossorigin
>
```

### 系统字体栈

**性能优先方案**：
```css
body {
  font-family:
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    Oxygen,
    Ubuntu,
    Cantarell,
    sans-serif;
}
```

---

## JavaScript 优化

### 代码拆分

**基于路由的拆分**：
```javascript
// React Router
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Gallery = lazy(() => import('./pages/Gallery'));

<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/about" element={<About />} />
    <Route path="/gallery" element={<Gallery />} />
  </Routes>
</Suspense>
```

**基于组件的拆分**：
```javascript
// Load heavy components only when needed
const HeavyChart = lazy(() => import('./components/HeavyChart'));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Chart</button>
      {showChart && (
        <Suspense fallback={<Skeleton />}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```

### Tree Shaking

**确保 tree shaking 生效**：
```javascript
// Good: Named imports
import { map, filter } from 'lodash-es';

// Bad: Default import (imports entire library)
import _ from 'lodash';
```

### 打包体积分析

**Webpack Bundle Analyzer**：
```bash
npm install --save-dev webpack-bundle-analyzer

# Add to webpack.config.js
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

plugins: [
  new BundleAnalyzerPlugin()
]
```

**Vite**：
```bash
npm install --save-dev rollup-plugin-visualizer

# vite.config.js
import { visualizer } from 'rollup-plugin-visualizer';

export default {
  plugins: [visualizer({ open: true })]
}
```

---

## CSS 优化

### 关键 CSS

**内联首屏 CSS**：
```html
<style>
  /* Critical CSS inlined */
  body { font-family: sans-serif; }
  .hero { height: 100vh; }
</style>

<!-- Defer non-critical CSS -->
<link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="styles.css"></noscript>
```

**工具**：
- Critical（npm 包）
- Critters（Vite/Webpack 插件）

### 移除未使用的 CSS

**PurgeCSS**：
```javascript
// postcss.config.js
module.exports = {
  plugins: [
    require('@fullhuman/postcss-purgecss')({
      content: ['./src/**/*.html', './src/**/*.jsx'],
      defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
    })
  ]
}
```

### CSS Containment

**提升渲染性能**：
```css
.card {
  /* Isolate layout calculations */
  contain: layout style paint;
}

.article {
  /* More aggressive containment */
  contain: strict;
}
```

---

## 3D 与 WebGL 优化

### 加载策略

**清单**：
- [ ] 加载时显示占位内容
- [ ] 对首屏下方的 3D 内容进行懒加载
- [ ] 初始使用低多边形模型
- [ ] 逐步增强到高多边形模型

**实现**：
```javascript
// Lazy load Three.js scene
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      loadThreeJSScene();
      observer.unobserve(entry.target);
    }
  });
});

observer.observe(document.querySelector('.3d-container'));
```

### 运行时性能

**清单**：
- [ ] 实现对象池（复用对象）
- [ ] 使用 LOD（细节层次）
- [ ] 视锥体剔除（不渲染屏幕外对象）
- [ ] 纹理压缩（Basis Universal、KTX2）
- [ ] 减少多边形数量（实时渲染 < 100k）
- [ ] 限制绘制调用（每帧 < 100 次）
- [ ] 对重复几何体使用实例化

**Three.js 示例**：
```javascript
// Object pooling
const objectPool = [];

function getObject() {
  return objectPool.length > 0 ? objectPool.pop() : createNewObject();
}

function releaseObject(obj) {
  objectPool.push(obj);
}

// LOD (Level of Detail)
const lod = new THREE.LOD();
lod.addLevel(highPolyMesh, 0);   // 0-50m
lod.addLevel(mediumPolyMesh, 50); // 50-100m
lod.addLevel(lowPolyMesh, 100);   // 100m+
scene.add(lod);

// Instancing
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshStandardMaterial();
const count = 10000;

const mesh = new THREE.InstancedMesh(geometry, material, count);
scene.add(mesh);
```

### 纹理优化

**清单**：
- [ ] 使用 2 的幂次尺寸（512、1024、2048）
- [ ] 压缩纹理（Basis、KTX2）
- [ ] 使用纹理图集
- [ ] 降低纹理分辨率（不在所有场景使用 4K）
- [ ] 启用 mipmap

---

## 加载策略

### 关键渲染路径

**优化顺序**：

1. **HTML**（初始）
2. **关键 CSS**（内联）
3. **关键 JavaScript**（延迟其余部分）
4. **字体**（预加载，font-display: swap）
5. **图片**（懒加载首屏以下内容）

**实现**：
```html
<!DOCTYPE html>
<html>
<head>
  <!-- Critical CSS inlined -->
  <style>/* Critical styles */</style>

  <!-- Preload critical resources -->
  <link rel="preload" as="font" href="font.woff2" type="font/woff2" crossorigin>
  <link rel="preload" as="image" href="hero.webp">

  <!-- Defer non-critical CSS -->
  <link rel="preload" href="styles.css" as="style" onload="this.onload=null;this.rel='stylesheet'">

  <!-- Defer JavaScript -->
  <script defer src="main.js"></script>
</head>
<body>
  <!-- Content -->
</body>
</html>
```

### 资源提示

**Preconnect（DNS、TCP、TLS）**：
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://cdn.example.com">
```

**DNS-Prefetch**：
```html
<link rel="dns-prefetch" href="https://analytics.example.com">
```

**Prefetch（下一页）**：
```html
<link rel="prefetch" href="/next-page.html">
```

---

## 缓存与 CDN

### HTTP 缓存头

**静态资源（不可变）**：
```
Cache-Control: public, max-age=31536000, immutable
```

**HTML（需重新验证）**：
```
Cache-Control: no-cache
```

**API 响应**：
```
Cache-Control: public, max-age=3600, must-revalidate
```

### Service Worker 缓存

**Workbox**：
```javascript
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';

// Precache build assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache images
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({ cacheName: 'images' })
);

// Network-first for HTML
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({ cacheName: 'pages' })
);
```

---

## 监控与测量

### 真实用户监控（RUM）

**Web Vitals**：
```bash
npm install web-vitals
```

```javascript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics({ name, value, id }) {
  // Send to your analytics endpoint
  fetch('/analytics', {
    method: 'POST',
    body: JSON.stringify({ name, value, id })
  });
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### 性能预算

**Lighthouse CI**：
```json
// lighthouserc.json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "first-contentful-paint": ["error", {"maxNumericValue": 1800}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}],
        "total-blocking-time": ["error", {"maxNumericValue": 200}]
      }
    }
  }
}
```

### Chrome DevTools

**Performance 面板**：
1. 打开 DevTools（F12）
2. 切换到 Performance 标签页
3. 点击 Record 按钮
4. 与页面交互
5. 停止录制
6. 分析火焰图

**重点关注**：
- 长任务（> 50ms）
- 过多的布局抖动
- 强制同步布局
- 绘制闪烁

---

*最后更新：2024 年*
*基准基于中位 4G 移动网络连接*
