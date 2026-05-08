# 断点策略

## 概述

有效的断点策略关注内容需求而非设备尺寸。现代响应式设计使用更少、内容驱动的断点，并结合流体技术。

## 移动优先方法

### 核心理念

从最小屏幕开始，然后逐渐为更大屏幕增强。

```css
/* 基础样式（移动优先） */
.component {
  display: flex;
  flex-direction: column;
  padding: 1rem;
}

/* 为更大屏幕增强 */
@media (min-width: 640px) {
  .component {
    flex-direction: row;
    padding: 1.5rem;
  }
}

@media (min-width: 1024px) {
  .component {
    padding: 2rem;
  }
}
```

### 好处

1. **性能**：移动设备仅加载必要的 CSS
2. **渐进增强**：功能是添加而非削减
3. **内容优先**：强制关注首先聚焦于基本内容
4. **简洁性**：更容易推理级联样式

## 常见断点尺度

### Tailwind CSS 默认值

```css
/* Tailwind 断点 */
/* sm: 640px  - 横屏手机 */
/* md: 768px  - 平板 */
/* lg: 1024px - 笔记本电脑 */
/* xl: 1280px - 桌面显示器 */
/* 2xl: 1536px - 大桌面显示器 */

@media (min-width: 640px) {
  /* sm */
}
@media (min-width: 768px) {
  /* md */
}
@media (min-width: 1024px) {
  /* lg */
}
@media (min-width: 1280px) {
  /* xl */
}
@media (min-width: 1536px) {
  /* 2xl */
}
```

### Bootstrap 5

```css
/* Bootstrap 断点 */
/* sm: 576px */
/* md: 768px */
/* lg: 992px */
/* xl: 1200px */
/* xxl: 1400px */

@media (min-width: 576px) {
  /* sm */
}
@media (min-width: 768px) {
  /* md */
}
@media (min-width: 992px) {
  /* lg */
}
@media (min-width: 1200px) {
  /* xl */
}
@media (min-width: 1400px) {
  /* xxl */
}
```

### 极简尺度

```css
/* 简化的 3 断点系统 */
/* 基础：移动端 (< 600px) */
/* 中等：平板和小型笔记本 (600px - 1024px) */
/* 大：桌面端 (> 1024px) */

:root {
  --bp-md: 600px;
  --bp-lg: 1024px;
}

@media (min-width: 600px) {
  /* 中等 */
}
@media (min-width: 1024px) {
  /* 大 */
}
```

## 基于内容的断点

### 寻找自然断点

使用基于设备的断点，而是识别你的内容在何处自然地需要变化。

```css
/* 不好：基于设备的思维 */
@media (min-width: 768px) {
  /* iPad 断点 */
}

/* 好：基于内容的思维 */
/* 侧边栏可以舒适地放在内容旁边的断点 */
@media (min-width: 50rem) {
  .layout {
    display: grid;
    grid-template-columns: 1fr 300px;
  }
}

/* 卡片可以在不拥挤的情况下显示 3 列时的断点 */
@media (min-width: 65rem) {
  .card-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}
```

### 测试内容断点

```javascript
// 查找内容断裂的位置
function findBreakpoints(selector) {
  const element = document.querySelector(selector);
  const breakpoints = [];

  for (let width = 320; width <= 1920; width += 10) {
    element.style.width = `${width}px`;

    // 检查溢出、换行或布局问题
    if (element.scrollWidth > element.clientWidth) {
      breakpoints.push({ width, issue: "overflow" });
    }
  }

  return breakpoints;
}
```

## 设计令牌集成

### 断点令牌

```css
:root {
  /* 断点值 */
  --breakpoint-sm: 640px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1280px;
  --breakpoint-2xl: 1536px;

  /* 每个断点的容器宽度 */
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
  --container-xl: 1280px;
  --container-2xl: 1536px;
}

.container {
  width: 100%;
  max-width: var(--container-lg);
  margin-inline: auto;
  padding-inline: var(--space-4);
}
```

### JavaScript 集成

```typescript
// 断点常量
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
} as const;

// 媒体查询钩子
function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

// 断点钩子
function useBreakpoint() {
  const isSmall = useMediaQuery(`(min-width: ${breakpoints.sm}px)`);
  const isMedium = useMediaQuery(`(min-width: ${breakpoints.md}px)`);
  const isLarge = useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
  const isXLarge = useMediaQuery(`(min-width: ${breakpoints.xl}px)`);

  return {
    isMobile: !isSmall,
    isTablet: isSmall && !isLarge,
    isDesktop: isLarge,
    current: isXLarge
      ? "xl"
      : isLarge
        ? "lg"
        : isMedium
          ? "md"
          : isSmall
            ? "sm"
            : "base",
  };
}
```

## 特性查询

### @supports 用于渐进增强

```css
/* 特性检测而非浏览器检测 */
@supports (display: grid) {
  .layout {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
}

@supports (container-type: inline-size) {
  .card-container {
    container-type: inline-size;
  }

  @container (min-width: 400px) {
    .card {
      flex-direction: row;
    }
  }
}

@supports (aspect-ratio: 16/9) {
  .video-container {
    aspect-ratio: 16/9;
  }
}

/* 旧浏览器的降级方案 */
@supports not (gap: 1rem) {
  .flex-container > * + * {
    margin-left: 1rem;
  }
}
```

### 组合特性与尺寸查询

```css
/* 仅在支持且屏幕足够大时应用网格布局 */
@supports (display: grid) {
  @media (min-width: 768px) {
    .layout {
      display: grid;
      grid-template-columns: 250px 1fr;
    }
  }
}
```

## 按组件的响应式模式

### 导航

```css
.nav {
  /* 移动端：垂直堆叠 */
  display: flex;
  flex-direction: column;
}

@media (min-width: 768px) {
  .nav {
    /* 平板+：水平 */
    flex-direction: row;
    align-items: center;
  }
}

/* 或使用容器查询 */
.nav-container {
  container-type: inline-size;
}

@container (min-width: 600px) {
  .nav {
    flex-direction: row;
  }
}
```

### 卡片网格

```css
.cards {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .cards {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .cards {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .cards {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* 更好：auto-fit + 最小尺寸 */
.cards-auto {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
}
```

### 英雄区域

```css
.hero {
  min-height: 50vh;
  padding: var(--space-lg) var(--space-md);
  text-align: center;
}

.hero-title {
  font-size: clamp(2rem, 5vw + 1rem, 4rem);
}

.hero-subtitle {
  font-size: clamp(1rem, 2vw + 0.5rem, 1.5rem);
}

@media (min-width: 768px) {
  .hero {
    min-height: 70vh;
    display: flex;
    align-items: center;
    text-align: left;
  }

  .hero-content {
    max-width: 60%;
  }
}

@media (min-width: 1024px) {
  .hero {
    min-height: 80vh;
  }

  .hero-content {
    max-width: 50%;
  }
}
```

### 表格

```css
/* 移动端：卡片或水平滚动 */
.table-container {
  overflow-x: auto;
}

.responsive-table {
  min-width: 600px;
}

/* 替代方案：在移动端转换为卡片 */
@media (max-width: 639px) {
  .responsive-table {
    min-width: 0;
  }

  .responsive-table thead {
    display: none;
  }

  .responsive-table tr {
    display: block;
    margin-bottom: 1rem;
    border: 1px solid var(--border);
    border-radius: 0.5rem;
    padding: 1rem;
  }

  .responsive-table td {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border: none;
  }

  .responsive-table td::before {
    content: attr(data-label);
    font-weight: 600;
  }
}
```

## 打印样式

```css
@media print {
  /* 移除非必要元素 */
  .nav,
  .sidebar,
  .footer,
  .ads {
    display: none;
  }

  /* 重置颜色和背景 */
  * {
    background: white !important;
    color: black !important;
    box-shadow: none !important;
  }

  /* 确保内容适合页面 */
  .container {
    max-width: 100%;
    padding: 0;
  }

  /* 处理分页 */
  h1,
  h2,
  h3 {
    page-break-after: avoid;
  }

  img,
  table {
    page-break-inside: avoid;
  }

  /* 显示链接 URL */
  a[href^="http"]::after {
    content: " (" attr(href) ")";
    font-size: 0.8em;
  }
}
```

## 偏好查询

```css
/* 深色模式偏好 */
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #1a1a1a;
    --text: #f0f0f0;
  }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* 高对比度偏好 */
@media (prefers-contrast: high) {
  :root {
    --text: #000;
    --bg: #fff;
    --border: #000;
  }

  .button {
    border: 2px solid currentColor;
  }
}

/* 减少数据偏好 */
@media (prefers-reduced-data: reduce) {
  .hero-video {
    display: none;
  }

  .hero-image {
    display: block;
  }
}
```

## 测试断点

```javascript
// 自动化断点测试
async function testBreakpoints(page, breakpoints) {
  const results = [];

  for (const [name, width] of Object.entries(breakpoints)) {
    await page.setViewportSize({ width, height: 800 });

    // 检查水平溢出
    const hasOverflow = await page.evaluate(() => {
      return (
        document.documentElement.scrollWidth >
        document.documentElement.clientWidth
      );
    });

    // 检查脱离屏幕的元素
    const offscreenElements = await page.evaluate(() => {
      const elements = document.querySelectorAll("*");
      return Array.from(elements).filter((el) => {
        const rect = el.getBoundingClientRect();
        return rect.right > window.innerWidth || rect.left < 0;
      }).length;
    });

    results.push({
      breakpoint: name,
      width,
      hasOverflow,
      offscreenElements,
    });
  }

  return results;
}
```

## 资源

- [Tailwind CSS Breakpoints](https://tailwindcss.com/docs/responsive-design)
- [The 100% Correct Way to Do CSS Breakpoints](https://www.freecodecamp.org/news/the-100-correct-way-to-do-css-breakpoints-88d6a5ba1862/)
- [Modern CSS Solutions](https://moderncss.dev/)
- [Defensive CSS](https://defensivecss.dev/)
