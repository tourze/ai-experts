# Web 无障碍指南（WCAG AAA 合规）

## 概述

遵循 WCAG 2.1/2.2 Level AAA 标准的 Web 无障碍合规全面指南。本文涵盖了现代 Web 设计中最关键的无障碍要求。

**目标标准**：WCAG 2.1 Level AAA（在实际可行情况下），以 Level AA 为最低基线。

---

## 颜色与对比度

### WCAG 对比度要求

**Level AA（最低要求）**：
- 普通文本（< 18pt）：4.5:1 对比度
- 大号文本（≥ 18pt 或 14pt 加粗）：3:1 对比度

**Level AAA（增强要求）**：
- 普通文本：**7:1 对比度**
- 大号文本：**4.5:1 对比度**

### 检查对比度

**手动计算**：
```javascript
function getLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(rgb1, rgb2) {
  const l1 = getLuminance(...rgb1);
  const l2 = getLuminance(...rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
```

**工具**：
- WebAIM 对比度检查器：https://webaim.org/resources/contrastchecker/
- Stark（Figma 插件）
- Chrome DevTools 无障碍面板

### 颜色系统（AAA 合规）

**使用 OKLCH 色彩空间**：
```css
:root {
  --color-text-primary: oklch(20% 0 0); /* #1a1a1a, 11.6:1 */
  --color-text-secondary: oklch(40% 0 0); /* #666666, 7.3:1 */
  --color-bg-primary: oklch(98% 0 0);
  --color-bg-secondary: oklch(95% 0 0);
  --color-accent-blue: oklch(45% 0.2 250); /* 7.1:1 */
  --color-accent-green: oklch(50% 0.15 140); /* 7.2:1 */
  --color-link: oklch(40% 0.2 250); /* 8.3:1 */
  --color-link-hover: oklch(35% 0.25 250); /* 10.5:1 */
}
```

### 色盲考虑

**应避免**：
- 仅以红绿作为区分方式（影响 8% 的男性用户）
- 仅依赖颜色传达信息

**最佳实践**：
- 在颜色之外配合图案、形状或图标
- 使用色盲模拟器进行测试
- 提供高对比度模式

**模拟工具**：
- Chrome DevTools：渲染 > 模拟视觉缺陷
- Colorblindly（浏览器扩展）
- Stark（Figma）

---

## 排版与可读性

### 字体大小要求

**WCAG 指南**：
- 正文字体：最小 16px（1rem）
- 小号字体：最小 14px（0.875rem）
- 用户必须能够放大到 200% 而不损失功能

**推荐字号**：
```css
:root {
  --font-size-sm: clamp(0.875rem, 0.8rem + 0.375vw, 1rem);
  --font-size-base: clamp(1rem, 0.9rem + 0.5vw, 1.25rem);
  --font-size-lg: clamp(1.25rem, 1.1rem + 0.75vw, 1.75rem);
  --font-size-xl: clamp(1.75rem, 1.5rem + 1.25vw, 2.5rem);
}

body {
  font-size: var(--font-size-base);
  line-height: 1.5;
}
```

### 行高与间距

**WCAG 1.4.12（Level AAA）**：
- 行高：最小为字体大小的 1.5 倍
- 段落间距：最小为字体大小的 2 倍
- 字符间距：最小为字体大小的 0.12 倍
- 单词间距：最小为字体大小的 0.16 倍

```css
p {
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  letter-spacing: 0.01em;
  word-spacing: 0.05em;
}
```

### 字体选择

**无障碍友好字体**：
- 无衬线：Inter、Roboto、Open Sans、Atkinson Hyperlegible
- 衬线：Georgia、Merriweather、Lora
- 避免：过度装饰、细字重（< 300）、长篇全大写

**阅读障碍友好**：
- OpenDyslexic、Atkinson Hyperlegible、Comic Sans

---

## 键盘导航

### 要求

**所有交互元素必须**：
- 可通过 Tab 键聚焦
- 可通过 Enter 或 Space 激活
- 可通过 Escape 关闭（模态框、下拉菜单）
- 可通过方向键导航（在适当情况下）

### Tab 顺序

```html
<!-- 自然的 DOM 顺序最佳 -->
<button tabindex="0">First</button>
<button tabindex="0">Second</button>
<!-- 避免使用 tabindex > 0 -->
```

**跳过链接**：
```html
<a href="#main-content" class="skip-link">Skip to main content</a>
<nav>...</nav>
<main id="main-content"><!-- 主要内容 --></main>
```

```css
.skip-link { position: absolute; top: -40px; left: 0; background: #000; color: #fff; padding: 8px; z-index: 100; }
.skip-link:focus { top: 0; }
```

### 焦点指示器

**WCAG 2.4.7（Level AA）**：焦点指示器必须可见，最小 2px 粗细，与背景对比度 3:1。

```css
:focus-visible {
  outline: 3px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: 4px;
}
:focus:not(:focus-visible) { outline: none; }
button:focus-visible {
  outline: 3px solid #3b82f6;
  outline-offset: 2px;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2);
}
```

### 键盘模式

**模态对话框焦点锁定**：
```javascript
function trapFocus(element) {
  const focusable = element.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  const first = focusable[0], last = focusable[focusable.length - 1];
  element.addEventListener('keydown', (e) => {
    if (e.key === 'Tab') {
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    if (e.key === 'Escape') closeModal();
  });
  first.focus();
}
```

**下拉菜单方向键导航**：
```javascript
function handleDropdownKeys(e) {
  const items = Array.from(dropdown.querySelectorAll('[role="menuitem"]'));
  const idx = items.indexOf(document.activeElement);
  switch (e.key) {
    case 'ArrowDown': e.preventDefault(); items[(idx + 1) % items.length].focus(); break;
    case 'ArrowUp': e.preventDefault(); items[(idx - 1 + items.length) % items.length].focus(); break;
    case 'Home': e.preventDefault(); items[0].focus(); break;
    case 'End': e.preventDefault(); items[items.length - 1].focus(); break;
    case 'Escape': closeDropdown(); triggerButton.focus(); break;
  }
}
```

---

## 屏幕阅读器支持

### ARIA 属性

**地标**：
```html
<header role="banner">
  <nav role="navigation" aria-label="Main"><!-- 导航 --></nav>
</header>
<main role="main"><!-- 主要内容 --></main>
<aside role="complementary" aria-label="Related articles"><!-- 侧边栏 --></aside>
<footer role="contentinfo"><!-- 页脚 --></footer>
```

**按钮标签**：
```html
<button aria-label="Close menu"><svg>...</svg></button>
<button><svg aria-hidden="true">...</svg> Submit</button>
```

**实时区域**：
```html
<div role="status" aria-live="polite" aria-atomic="true">Loading content...</div>
<div role="alert" aria-live="assertive">Error: Form submission failed.</div>
```

**自定义组件**：
```html
<!-- 手风琴 -->
<h3><button aria-expanded="false" aria-controls="panel-1" id="button-1">Section 1</button></h3>
<div id="panel-1" role="region" aria-labelledby="button-1" hidden>Content...</div>

<!-- 选项卡 -->
<div role="tablist" aria-label="Content sections">
  <button role="tab" aria-selected="true" aria-controls="panel-1">Tab 1</button>
  <button role="tab" aria-selected="false" aria-controls="panel-2">Tab 2</button>
</div>
<div role="tabpanel" id="panel-1" aria-labelledby="tab-1">Panel content...</div>
```

### Alt 文本指南

```html
<!-- 信息性图片 --> <img src="chart.png" alt="Bar chart showing 50% increase in sales">
<!-- 装饰性图片 --> <img src="decorative.png" alt="" role="presentation">
<!-- 复杂图片 --> <img src="infographic.png" alt="Sales data for Q4" longdesc="sales-data.html">
```

**最佳实践**：
- 描述内容/功能，而非"image of..."
- 控制在 150 字符以内
- 装饰性图片使用空 alt（`alt=""`）
- 为复杂图片提供长描述

---

## 动效与动画

### 减少动效偏好（WCAG 2.3.3 Level AAA）

用户必须能够禁用非必要的动效。

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
  .loading-spinner { animation-duration: 1s; }
}
```

```javascript
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if (prefersReducedMotion) { /* 禁用或简化动画 */ }
```

**安全动画**：淡入/淡出、短距离滑动（< 50px）、小幅缩放（0.95-1.05）
**避免**：闪烁、快速移动、视差、持续旋转、透视变换

---

## 触摸目标与移动端

### WCAG 2.5.5（Level AAA）

**目标大小**：最小 44×44px（iOS）或 48×48px（Android），目标之间最小 8px 间距。

```css
button, a { min-height: 44px; min-width: 44px; padding: 12px 24px; }
button::before { content: ''; position: absolute; inset: -8px; }
```

**视口**：允许放大到 5 倍（WCAG 要求）
```html
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
```

**触摸手势**：避免复杂手势（多指、长按），提供替代交互方式，不要依赖悬停状态。

---

## 表单与输入

### 标签与说明（WCAG 3.3.2 Level A）

每个输入必须有可见标签。

```html
<label for="email">Email address</label>
<input id="email" type="email" required aria-describedby="email-help">
<small id="email-help">We'll never share your email.</small>

<input id="email" type="email" aria-invalid="true" aria-describedby="email-error">
<div id="email-error" role="alert">Please enter a valid email address.</div>
```

### 无障碍验证

```javascript
function validateEmail(input) {
  const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
  if (isValid) {
    input.setAttribute('aria-invalid', 'false');
    input.removeAttribute('aria-describedby');
    removeError(input);
  } else {
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-describedby', `${input.id}-error`);
    showError(input, 'Please enter a valid email address.');
  }
}
```

### 必填字段

```html
<label for="name">Full name <abbr title="required" aria-label="required">*</abbr></label>
<input id="name" type="text" required aria-required="true">
```

**视觉 + 程序化**：视觉指示器 + `required` 属性 + `aria-required="true"`

---

## 焦点管理

```javascript
function openModal() {
  modal.style.display = 'block';
  modal.setAttribute('aria-hidden', 'false');
  const first = modal.querySelector('button, [href], input');
  first.focus();
  trapFocus(modal);
}
function closeModal() {
  modal.style.display = 'none';
  modal.setAttribute('aria-hidden', 'true');
  triggerButton.focus();
}
```

**最佳实践**：
- 遵循视觉顺序（从上到下，从左到右）
- 使用 `tabindex="-1"` 仅用于程序化焦点
- 避免使用 `tabindex > 0`

---

## 语义化 HTML

### 标题层级（WCAG 1.3.1 Level A）

**正确**：h1 → h2 → h3（不跳级）
**错误**：h1 → h3（跳过了 h2）

### 地标区域

```html
<header><nav aria-label="Main navigation"><!-- 导航 --></nav></header>
<main>
  <article><!-- 文章 --></article>
  <aside aria-label="Related links"><!-- 侧边栏 --></aside>
</main>
<footer><nav aria-label="Footer navigation"><!-- 页脚导航 --></nav></footer>
```

### 列表与表格

```html
<ul><li>Item 1</li><li>Item 2</li></ul>
<table>
  <caption>Sales Data Q4 2024</caption>
  <thead><tr><th scope="col">Month</th><th scope="col">Sales</th></tr></thead>
  <tbody><tr><td>October</td><td>$50,000</td></tr></tbody>
</table>
```

---

## 测试与审计

### 自动化测试工具

- axe DevTools（Chrome/Firefox）、WAVE、Lighthouse（Chrome DevTools）
```bash
# If the tools are already available:
pa11y https://example.com
axe https://example.com

# If they are missing, ask before adding project-local dev dependencies:
npm install --save-dev pa11y @axe-core/cli
npx pa11y https://example.com
npx axe https://example.com
```

### 手动测试清单

**键盘导航**：Tab 遍历所有交互元素 / Enter+Space 激活 / Escape 关闭 / 方向键导航
**屏幕阅读器**：NVDA（Windows）、VoiceOver（Mac）、JAWS 测试
**视觉**：放大到 200%、颜色对比度、焦点指示器、色盲模拟器
**动效**：启用 `prefers-reduced-motion` 验证动画已禁用

### 屏幕阅读器快捷键

**NVDA（Windows）**：Caps Lock 或 Insert 开关 / H 下一个标题 / D 下一个地标
**VoiceOver（Mac）**：Cmd+F5 开关 / Ctrl+Option+U 转轮
**JAWS（Windows）**：Insert+F6 列出标题 / Insert+F7 列出链接

---

## WCAG 合规速查

| 级别 | 关键要求 |
|------|----------|
| A（必须有） | 文本替代方案、键盘可访问、颜色不唯一表意、表单标签、正确标题层级 |
| AA（应有） | 4.5:1 对比度（普通文本）、3:1（大号）、缩放到 200%、焦点可见、多种导航方式 |
| AAA（锦上添花） | 7:1 对比度（普通文本）、4.5:1（大号）、目标 44×44px、无时间限制 |

---

*最后更新：2024 · 基于 WCAG 2.1 / 2.2 标准*
