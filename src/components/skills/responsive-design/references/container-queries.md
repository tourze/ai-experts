# 容器查询深入解析

## 概述

容器查询通过允许元素响应其容器的大小而非视口，实现了基于组件的响应式设计。这种范式转变使得真正可复用的组件成为可能。

## 浏览器支持

容器查询在现代浏览器中支持良好（Chrome 105+、Firefox 110+、Safari 16+）。对于旧版浏览器，提供优雅的降级方案。

## 包含基础

### 容器类型

```css
/* 尺寸包含 - 基于内联和块尺寸的查询 */
.container {
  container-type: size;
}

/* 内联尺寸包含 - 仅基于内联（宽度）尺寸的查询 */
/* 最常见且推荐使用 */
.container {
  container-type: inline-size;
}

/* 普通 - 仅样式查询，无尺寸查询 */
.container {
  container-type: normal;
}
```

### 命名容器

```css
/* 用于定向查询的命名容器 */
.card-wrapper {
  container-type: inline-size;
  container-name: card;
}

/* 简写 */
.card-wrapper {
  container: card / inline-size;
}

/* 查询特定容器 */
@container card (min-width: 400px) {
  .card-content {
    display: flex;
  }
}
```

## 容器查询语法

### 基于宽度的查询

```css
.container {
  container-type: inline-size;
}

/* 最小宽度 */
@container (min-width: 300px) {
  .element {
    /* 样式 */
  }
}

/* 最大宽度 */
@container (max-width: 500px) {
  .element {
    /* 样式 */
  }
}

/* 范围语法 */
@container (300px <= width <= 600px) {
  .element {
    /* 样式 */
  }
}

/* 精确宽度 */
@container (width: 400px) {
  .element {
    /* 样式 */
  }
}
```

### 组合条件

```css
/* AND 条件 */
@container (min-width: 400px) and (max-width: 800px) {
  .element {
    /* 样式 */
  }
}

/* OR 条件 */
@container (max-width: 300px) or (min-width: 800px) {
  .element {
    /* 样式 */
  }
}

/* NOT 条件 */
@container not (min-width: 400px) {
  .element {
    /* 样式 */
  }
}
```

### 命名容器查询

```css
/* 多个命名容器 */
.page-wrapper {
  container: page / inline-size;
}

.sidebar-wrapper {
  container: sidebar / inline-size;
}

/* 定向到特定容器 */
@container page (min-width: 1024px) {
  .main-content {
    max-width: 800px;
  }
}

@container sidebar (min-width: 300px) {
  .sidebar-widget {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }
}
```

## 容器查询单位

```css
/* 容器查询长度单位 */
.element {
  /* 容器查询宽度 - 1cqw = 容器宽度的 1% */
  width: 50cqw;

  /* 容器查询高度 - 1cqh = 容器高度的 1% */
  height: 50cqh;

  /* 容器查询内联 - 1cqi = 容器内联尺寸的 1% */
  padding-inline: 5cqi;

  /* 容器查询块 - 1cqb = 容器块尺寸的 1% */
  padding-block: 3cqb;

  /* 容器查询最小值 - cqi 和 cqb 中的较小值 */
  font-size: 5cqmin;

  /* 容器查询最大值 - cqi 和 cqb 中的较大值 */
  margin: 2cqmax;
}

/* 实用示例：基于容器的流体排版 */
.card-title {
  font-size: clamp(1rem, 4cqi, 2rem);
}

.card-body {
  padding: clamp(0.75rem, 4cqi, 1.5rem);
}
```

## 样式查询

样式查询允许查询 CSS 自定义属性值。目前支持有限。

```css
/* 定义自定义属性 */
.card {
  --layout: stack;
}

/* 查询属性值 */
@container style(--layout: stack) {
  .card-content {
    display: flex;
    flex-direction: column;
  }
}

@container style(--layout: inline) {
  .card-content {
    display: flex;
    flex-direction: row;
  }
}

/* 通过自定义属性切换布局 */
.card.horizontal {
  --layout: inline;
}
```

## 实用模式

### 响应式卡片组件

```css
.card-container {
  container: card / inline-size;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: clamp(1rem, 4cqi, 2rem);
}

.card-image {
  aspect-ratio: 16/9;
  width: 100%;
  object-fit: cover;
  border-radius: 0.5rem;
}

.card-title {
  font-size: clamp(1rem, 4cqi, 1.5rem);
  font-weight: 600;
}

/* 中等容器：并排布局 */
@container card (min-width: 400px) {
  .card {
    flex-direction: row;
    align-items: flex-start;
  }

  .card-image {
    width: 40%;
    aspect-ratio: 1;
  }

  .card-content {
    flex: 1;
  }
}

/* 大容器：增强布局 */
@container card (min-width: 600px) {
  .card-image {
    width: 250px;
  }

  .card-title {
    font-size: 1.5rem;
  }

  .card-actions {
    display: flex;
    gap: 0.5rem;
  }
}
```

### 响应式网格项

```css
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.grid-item {
  container-type: inline-size;
}

.item-content {
  padding: 1rem;
}

/* 项目根据自身尺寸调整，而非视口 */
@container (min-width: 350px) {
  .item-content {
    padding: 1.5rem;
  }

  .item-title {
    font-size: 1.25rem;
  }
}

@container (min-width: 500px) {
  .item-content {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 1rem;
  }
}
```

### 仪表盘小组件

```css
.widget-container {
  container: widget / inline-size;
}

.widget {
  --chart-height: 150px;
  padding: 1rem;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.widget-chart {
  height: var(--chart-height);
}

.widget-stats {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.5rem;
}

@container widget (min-width: 300px) {
  .widget {
    --chart-height: 200px;
  }

  .widget-stats {
    grid-template-columns: repeat(2, 1fr);
  }
}

@container widget (min-width: 500px) {
  .widget {
    --chart-height: 250px;
    padding: 1.5rem;
  }

  .widget-stats {
    grid-template-columns: repeat(4, 1fr);
  }

  .widget-actions {
    display: flex;
    gap: 0.5rem;
  }
}
```

### 导航组件

```css
.nav-container {
  container: nav / inline-size;
}

.nav {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
}

.nav-link-text {
  display: none;
}

.nav-link-icon {
  width: 1.5rem;
  height: 1.5rem;
}

/* 容器足够宽时显示文本 */
@container nav (min-width: 200px) {
  .nav-link-text {
    display: block;
  }
}

/* 更宽容器的水平布局 */
@container nav (min-width: 600px) {
  .nav {
    flex-direction: row;
  }

  .nav-link {
    padding: 0.5rem 1rem;
  }
}
```

## Tailwind CSS 集成

```tsx
// Tailwind v3.2+ 支持容器查询
// tailwind.config.js
module.exports = {
  plugins: [require("@tailwindcss/container-queries")],
};

// 组件使用
function Card({ title, image, description }) {
  return (
    // @container 创建包含上下文
    <div className="@container">
      <article className="flex flex-col @md:flex-row @md:gap-4">
        <img
          src={image}
          alt=""
          className="w-full @md:w-48 @lg:w-64 aspect-video @md:aspect-square object-cover rounded-lg"
        />
        <div className="p-4 @md:p-0">
          <h2 className="text-lg @md:text-xl @lg:text-2xl font-semibold">
            {title}
          </h2>
          <p className="mt-2 text-muted-foreground @lg:text-lg">
            {description}
          </p>
        </div>
      </article>
    </div>
  );
}

// 命名容器
function Dashboard() {
  return (
    <div className="@container/main">
      <aside className="@container/sidebar">
        <nav className="flex flex-col @lg/sidebar:flex-row">{/* ... */}</nav>
      </aside>
      <main className="@lg/main:grid @lg/main:grid-cols-2">{/* ... */}</main>
    </div>
  );
}
```

## 降级策略

```css
/* 为不支持容器查询的浏览器提供降级方案 */
.card {
  /* 默认（降级）样式 */
  display: flex;
  flex-direction: column;
}

/* 容器支持的特性查询 */
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

/* 替代方案：媒体查询降级 */
.card {
  display: flex;
  flex-direction: column;
}

/* 基于视口的降级 */
@media (min-width: 768px) {
  .card {
    flex-direction: row;
  }
}

/* 支持时使用容器查询增强 */
@supports (container-type: inline-size) {
  @media (min-width: 768px) {
    .card {
      flex-direction: column; /* 重置 */
    }
  }

  @container (min-width: 400px) {
    .card {
      flex-direction: row;
    }
  }
}
```

## 性能考虑

```css
/* 避免过度嵌套容器 */
/* 不好：太多嵌套容器 */
.level-1 {
  container-type: inline-size;
}
.level-2 {
  container-type: inline-size;
}
.level-3 {
  container-type: inline-size;
}
.level-4 {
  container-type: inline-size;
}

/* 好：策略性容器放置 */
.component-wrapper {
  container-type: inline-size;
}

/* 尽可能使用 inline-size 而非 size */
/* size 包含更昂贵 */
.container {
  container-type: inline-size; /* 推荐 */
  /* container-type: size; */ /* 仅在需要时 */
}
```

## 测试容器查询

```javascript
// 测试容器查询支持
const supportsContainerQueries = CSS.supports("container-type", "inline-size");

// 用于测试的 ResizeObserver
const observer = new ResizeObserver((entries) => {
  for (const entry of entries) {
    console.log("Container width:", entry.contentRect.width);
  }
});

observer.observe(document.querySelector(".container"));
```

## 资源

- [MDN Container Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_container_queries)
- [CSS Container Queries Spec](https://www.w3.org/TR/css-contain-3/)
- [Una Kravets: Container Queries](https://web.dev/cq-stable/)
- [Ahmad Shadeed: Container Queries Guide](https://ishadeed.com/article/container-queries-are-finally-here/)
