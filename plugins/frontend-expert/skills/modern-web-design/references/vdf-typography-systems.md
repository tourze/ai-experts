# 字体排印系统参考

## 模块化字号尺度

```tsx
const RATIOS = {
  minorSecond: 1.067, majorSecond: 1.125, minorThird: 1.2,
  majorThird: 1.25, perfectFourth: 1.333, perfectFifth: 1.5, goldenRatio: 1.618,
};

function generateScale(base: number, ratio: number, steps: number): number[] {
  const s: number[] = [];
  for (let i = -2; i <= steps; i++) s.push(Math.round(base * ratio ** i * 100) / 100);
  return s;
}
// 16px 基准 + 完全四度 → [9, 12, 16, 21.33, 28.43, 37.9, 50.52, 67.34, 89.76]
```

### CSS 字号 Token

```css
:root {
  --font-size-xs: 0.75rem; --font-size-sm: 0.875rem; --font-size-base: 1rem;
  --font-size-lg: 1.333rem; --font-size-xl: 1.5rem; --font-size-2xl: 1.777rem;
  --font-size-3xl: 2.369rem; --font-size-4xl: 3.157rem;
  --font-weight-normal: 400; --font-weight-medium: 500;
  --font-weight-semibold: 600; --font-weight-bold: 700;
  --line-height-tight: 1.1; --line-height-snug: 1.25;
  --line-height-normal: 1.5; --line-height-relaxed: 1.625;
  --letter-spacing-tight: -0.025em; --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em; --letter-spacing-wider: 0.05em;
}
```

## 字体加载策略

```css
@font-face {
  font-family: "Inter";
  src: url("/fonts/Inter-Variable.woff2") format("woff2-variations");
  font-weight: 100 900;
  font-display: swap; /* 立即显示后备字体，加载完成后切换 */
}
/* 后备字体匹配 */
@font-face {
  font-family: "Inter Fallback"; src: local("Arial");
  size-adjust: 107%; ascent-override: 90%; descent-override: 22%;
}
body { font-family: "Inter", "Inter Fallback", system-ui, sans-serif; }
```

### 预加载

```html
<link rel="preload" href="/fonts/Inter-Variable.woff2" as="font" type="font/woff2" crossorigin>
```

### 可变字体

```css
@font-face {
  font-family: "Inter"; src: url("/fonts/Inter-Variable.woff2") format("woff2");
  font-weight: 100 900; font-stretch: 75% 125%;
}
.custom-weight { font-variation-settings: "wght" 450 "wdth" 95; }
```

## 响应式字体排印

```css
h1 { font-size: clamp(2rem, 5vw + 1rem, 4rem); line-height: 1.1; }
h2 { font-size: clamp(1.5rem, 3vw + 0.5rem, 2.5rem); }
p { font-size: clamp(1rem, 1vw + 0.75rem, 1.25rem); line-height: 1.6; }
```

## 可读性指南

```css
.prose { max-width: 65ch; } /* 最佳行长 45-75 字符 */
pre { max-width: 80ch; }
/* 垂直节奏 —— 所有外边距为基线倍数 */
:root { --baseline: 1.5rem; }
h1 { margin-bottom: var(--baseline); }
p { line-height: var(--baseline); margin-bottom: var(--baseline); }
/* 文本换行 */
p { text-wrap: pretty; widows: 3; orphans: 3; }
h1, h2, h3 { text-wrap: balance; }
```

## 字体配对

```css
/* 衬线标题 + 无衬线正文 */
:root { --font-heading: "Playfair Display", Georgia, serif;
        --font-body: "Source Sans Pro", -apple-system, sans-serif; }
/* 几何标题 + 人文正文 */
:root { --font-heading: "Space Grotesk", sans-serif;
        --font-body: "IBM Plex Sans", sans-serif; }
/* 超级家族方案 —— 单 variable font 全用途 */
:root { --font-family: "Inter", system-ui, sans-serif; }
h1 { font-family: var(--font-family); font-weight: 800; letter-spacing: -0.02em; }
p { font-family: var(--font-family); font-weight: 400; }
```

## 语义字体排印类

```css
.text-display { font-size: var(--font-size-4xl); font-weight: var(--font-weight-bold);
  line-height: var(--line-height-tight); }
.text-headline { font-size: var(--font-size-3xl); font-weight: var(--font-weight-semibold); }
.text-body { font-size: var(--font-size-base); line-height: var(--line-height-normal); }
.text-caption { font-size: var(--font-size-xs); text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide); }
```

## OpenType 特性

```css
.fancy-text {
  font-variant-caps: small-caps; /* 小型大写 */
  font-variant-ligatures: common-ligatures; /* 连字 */
  font-variant-numeric: tabular-nums lining-nums; /* 等宽数字 */
}
.data-table td { font-variant-numeric: tabular-nums; } /* 列对齐 */
.prose { font-variant-numeric: oldstyle-nums; } /* 旧式数字 */
```
