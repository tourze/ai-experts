# 流体布局与排版

## 概述

流体设计通过使用相对单位和数学函数替代固定断点，创建平滑的缩放体验。这种方法减少了对媒体查询的需求，并创造了更自然感觉的界面。

## 流体排版

### clamp() 函数

```css
/* clamp(最小值, 首选值, 最大值) */
.heading {
  /* 不小于 1.5rem，不大于 3rem */
  /* 在这些值之间以 5vw 缩放 */
  font-size: clamp(1.5rem, 5vw, 3rem);
}
```

### 计算流体值

`clamp()` 中的首选值通常将基础大小与视口相对部分结合：

```css
/* 公式：clamp(最小值, 基础 + 比例 * vw, 最大值) */

/* 对于从 16px（320px 视口）缩放到 24px（1200px 视口）的文本： */
/* 斜率 = (24 - 16) / (1200 - 320) = 8 / 880 = 0.00909 */
/* y 轴截距 = 16 - 0.00909 * 320 = 13.09px = 0.818rem */

.text {
  font-size: clamp(1rem, 0.818rem + 0.909vw, 1.5rem);
}
```

### 类型尺度生成器

```javascript
// 生成流体类型尺度
function fluidType({
  minFontSize,
  maxFontSize,
  minViewport = 320,
  maxViewport = 1200,
}) {
  const minFontRem = minFontSize / 16;
  const maxFontRem = maxFontSize / 16;
  const minViewportRem = minViewport / 16;
  const maxViewportRem = maxViewport / 16;

  const slope = (maxFontRem - minFontRem) / (maxViewportRem - minViewportRem);
  const yAxisIntersection = minFontRem - slope * minViewportRem;

  return `clamp(${minFontRem}rem, ${yAxisIntersection.toFixed(4)}rem + ${(slope * 100).toFixed(4)}vw, ${maxFontRem}rem)`;
}

// 用法
const typeScale = {
  xs: fluidType({ minFontSize: 12, maxFontSize: 14 }),
  sm: fluidType({ minFontSize: 14, maxFontSize: 16 }),
  base: fluidType({ minFontSize: 16, maxFontSize: 18 }),
  lg: fluidType({ minFontSize: 18, maxFontSize: 20 }),
  xl: fluidType({ minFontSize: 20, maxFontSize: 24 }),
  "2xl": fluidType({ minFontSize: 24, maxFontSize: 32 }),
  "3xl": fluidType({ minFontSize: 30, maxFontSize: 48 }),
  "4xl": fluidType({ minFontSize: 36, maxFontSize: 60 }),
};
```

### 完整类型尺度

```css
:root {
  /* 基础：16-18px */
  --text-base: clamp(1rem, 0.9rem + 0.5vw, 1.125rem);

  /* 较小尺寸 */
  --text-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --text-xs: clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem);

  /* 较大尺寸 */
  --text-lg: clamp(1.125rem, 1rem + 0.625vw, 1.25rem);
  --text-xl: clamp(1.25rem, 1.1rem + 0.75vw, 1.5rem);
  --text-2xl: clamp(1.5rem, 1.2rem + 1.5vw, 2rem);
  --text-3xl: clamp(1.875rem, 1.4rem + 2.375vw, 2.5rem);
  --text-4xl: clamp(2.25rem, 1.5rem + 3.75vw, 3.5rem);
  --text-5xl: clamp(3rem, 1.8rem + 6vw, 5rem);

  /* 行高反向缩放 */
  --leading-tight: 1.25;
  --leading-normal: 1.5;
  --leading-relaxed: 1.75;
}

/* 应用到元素 */
body {
  font-size: var(--text-base);
  line-height: var(--leading-normal);
}

h1 {
  font-size: var(--text-4xl);
  line-height: var(--leading-tight);
}
h2 {
  font-size: var(--text-3xl);
  line-height: var(--leading-tight);
}
h3 {
  font-size: var(--text-2xl);
  line-height: var(--leading-tight);
}
h4 {
  font-size: var(--text-xl);
  line-height: var(--leading-normal);
}
h5 {
  font-size: var(--text-lg);
  line-height: var(--leading-normal);
}
h6 {
  font-size: var(--text-base);
  line-height: var(--leading-normal);
}

small {
  font-size: var(--text-sm);
}
```

## 流体间距

### 间距尺度

```css
:root {
  /* 随视口缩放的间距令牌 */
  --space-3xs: clamp(0.25rem, 0.2rem + 0.25vw, 0.375rem);
  --space-2xs: clamp(0.375rem, 0.3rem + 0.375vw, 0.5rem);
  --space-xs: clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem);
  --space-sm: clamp(0.75rem, 0.6rem + 0.75vw, 1rem);
  --space-md: clamp(1rem, 0.8rem + 1vw, 1.5rem);
  --space-lg: clamp(1.5rem, 1.2rem + 1.5vw, 2rem);
  --space-xl: clamp(2rem, 1.5rem + 2.5vw, 3rem);
  --space-2xl: clamp(3rem, 2rem + 5vw, 5rem);
  --space-3xl: clamp(4rem, 2.5rem + 7.5vw, 8rem);

  /* 升级配对（用于非对称间距） */
  --space-xs-sm: clamp(0.5rem, 0.3rem + 1vw, 1rem);
  --space-sm-md: clamp(0.75rem, 0.5rem + 1.25vw, 1.5rem);
  --space-md-lg: clamp(1rem, 0.6rem + 2vw, 2rem);
  --space-lg-xl: clamp(1.5rem, 1rem + 2.5vw, 3rem);
}

/* 使用示例 */
.section {
  padding-block: var(--space-xl);
  padding-inline: var(--space-md);
}

.card {
  padding: var(--space-md);
  gap: var(--space-sm);
}

.stack > * + * {
  margin-top: var(--space-md);
}
```

### 容器宽度

```css
:root {
  /* 流体最大宽度 */
  --container-xs: min(100% - 2rem, 20rem);
  --container-sm: min(100% - 2rem, 30rem);
  --container-md: min(100% - 2rem, 45rem);
  --container-lg: min(100% - 2rem, 65rem);
  --container-xl: min(100% - 3rem, 80rem);
  --container-2xl: min(100% - 4rem, 96rem);
}

.container {
  width: var(--container-lg);
  margin-inline: auto;
}

.prose {
  max-width: var(--container-md);
}

.full-bleed {
  width: 100vw;
  margin-inline: calc(-50vw + 50%);
}
```

## CSS Grid 流体布局

### Auto-fit 网格

```css
/* 填充可用空间的网格 */
.auto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
  gap: var(--space-md);
}

/* 带最大列数 */
.auto-grid-max-4 {
  display: grid;
  grid-template-columns: repeat(
    auto-fit,
    minmax(min(100%, max(200px, calc((100% - 3 * var(--space-md)) / 4))), 1fr)
  );
  gap: var(--space-md);
}
```

### 响应式网格区域

```css
.page-grid {
  display: grid;
  grid-template-columns:
    1fr
    min(var(--container-lg), 100%)
    1fr;
  grid-template-rows: auto 1fr auto;
}

.page-grid > * {
  grid-column: 2;
}

.full-width {
  grid-column: 1 / -1;
}

/* 带侧边栏的内容 */
.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-lg);
}

@media (min-width: 768px) {
  .content-grid {
    grid-template-columns: 1fr min(300px, 30%);
  }
}
```

### 流体宽高比

```css
/* 流体地保持宽高比 */
.aspect-video {
  aspect-ratio: 16 / 9;
}

.aspect-square {
  aspect-ratio: 1;
}

/* 变化的流体宽高比 */
.hero-image {
  aspect-ratio: 1; /* 移动端：方形 */
}

@media (min-width: 640px) {
  .hero-image {
    aspect-ratio: 4 / 3;
  }
}

@media (min-width: 1024px) {
  .hero-image {
    aspect-ratio: 16 / 9;
  }
}
```

## Flexbox 流体模式

### 灵活侧边栏

```css
/* 在太窄时折叠的侧边栏 */
.with-sidebar {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-lg);
}

.with-sidebar > :first-child {
  flex-basis: 300px;
  flex-grow: 1;
}

.with-sidebar > :last-child {
  flex-basis: 0;
  flex-grow: 999;
  min-width: 60%;
}
```

### 簇布局

```css
/* 项目自然簇状换行 */
.cluster {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  justify-content: flex-start;
  align-items: center;
}

/* 居中对齐的簇 */
.cluster-center {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  justify-content: center;
  align-items: center;
}

/* 两端对齐的簇 */
.cluster-spread {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  justify-content: space-between;
  align-items: center;
}
```

### 切换器布局

```css
/* 基于容器从水平切换到垂直 */
.switcher {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
}

.switcher > * {
  /* 当容器窄于阈值时项目变为垂直 */
  flex-grow: 1;
  flex-basis: calc((30rem - 100%) * 999);
}

/* 限制列数 */
.switcher > :nth-last-child(n + 4),
.switcher > :nth-last-child(n + 4) ~ * {
  flex-basis: 100%;
}
```

## 内在尺寸

### 基于内容的宽度

```css
/* 基于内容的尺寸 */
.fit-content {
  width: fit-content;
  max-width: 100%;
}

/* 最小内容尺寸 */
.min-content {
  width: min-content;
}

/* 最大内容尺寸 */
.max-content {
  width: max-content;
}

/* 实用示例 */
.button {
  width: fit-content;
  min-width: 8rem; /* 防止按钮过窄 */
  padding-inline: var(--space-md);
}

.tag {
  width: fit-content;
  padding: var(--space-2xs) var(--space-xs);
}

.modal {
  width: min(90vw, 600px);
  max-height: min(90vh, 800px);
}
```

### min() 和 max() 函数

```css
/* 无需媒体查询的响应式尺寸 */
.container {
  /* 视口的 90% 或 1200px，取较小值 */
  width: min(90%, 1200px);
  margin-inline: auto;
}

.hero-text {
  /* 至少 2rem，最多 4rem */
  font-size: max(2rem, min(5vw, 4rem));
}

.sidebar {
  /* 至少 200px，最多父元素的 25% */
  width: max(200px, min(300px, 25%));
}

.card-grid {
  /* 每张卡片至少 200px，填充可用空间 */
  grid-template-columns: repeat(auto-fit, minmax(max(200px, 100%/4), 1fr));
}
```

## 视口单位

### 现代视口单位

```css
/* 动态视口高度 - 考虑移动端浏览器 UI */
.full-height {
  min-height: 100dvh;
}

/* 小视口 - UI 可见时的最小尺寸 */
.hero {
  min-height: 100svh;
}

/* 大视口 - UI 隐藏时的最大尺寸 */
.backdrop {
  height: 100lvh;
}

/* 视口相对定位 */
.fixed-nav {
  position: fixed;
  inset-inline: 0;
  top: 0;
  height: max(60px, 8vh);
}

/* 带凹口设备的安全区域内边距 */
.safe-area {
  padding-top: env(safe-area-inset-top);
  padding-right: env(safe-area-inset-right);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
}
```

### 结合视口和容器单位

```css
/* 基于视口和容器的响应式 */
.component {
  container-type: inline-size;
}

.component-text {
  /* 在容器外使用视口，在容器内使用容器 */
  font-size: clamp(1rem, 2vw + 0.5rem, 1.5rem);
}

@container (min-width: 400px) {
  .component-text {
    font-size: clamp(1rem, 4cqi, 1.5rem);
  }
}
```

## 工具类

```css
/* Tailwind 风格的流体工具 */
.text-fluid-sm {
  font-size: var(--text-sm);
}
.text-fluid-base {
  font-size: var(--text-base);
}
.text-fluid-lg {
  font-size: var(--text-lg);
}
.text-fluid-xl {
  font-size: var(--text-xl);
}
.text-fluid-2xl {
  font-size: var(--text-2xl);
}
.text-fluid-3xl {
  font-size: var(--text-3xl);
}
.text-fluid-4xl {
  font-size: var(--text-4xl);
}

.p-fluid-sm {
  padding: var(--space-sm);
}
.p-fluid-md {
  padding: var(--space-md);
}
.p-fluid-lg {
  padding: var(--space-lg);
}

.gap-fluid-sm {
  gap: var(--space-sm);
}
.gap-fluid-md {
  gap: var(--space-md);
}
.gap-fluid-lg {
  gap: var(--space-lg);
}
```

## 资源

- [Utopia Fluid Type Calculator](https://utopia.fyi/)
- [Modern Fluid Typography](https://www.smashingmagazine.com/2022/01/modern-fluid-typography-css-clamp/)
- [Every Layout](https://every-layout.dev/)
- [CSS min(), max(), and clamp()](https://web.dev/min-max-clamp/)
