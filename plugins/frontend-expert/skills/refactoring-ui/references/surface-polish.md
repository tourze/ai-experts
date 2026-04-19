# Surface Polish — 视觉细节打磨

## 同心圆角

嵌套圆角元素时，外层圆角 = 内层圆角 + padding。圆角不匹配是界面"看起来不对"的最常见原因。

```
outerRadius = innerRadius + padding
```

```css
/* Good — 同心圆角 */
.card { border-radius: 20px; padding: 8px; }       /* 20 = 12 + 8 */
.card-inner { border-radius: 12px; }

/* Bad — 内外圆角相同 */
.card { border-radius: 12px; padding: 8px; }
.card-inner { border-radius: 12px; }               /* 看起来不协调 */
```

```tsx
// Tailwind — outer rounded-2xl(16px) - p-2(8px) = inner rounded-lg(8px) ✓
<div className="rounded-2xl p-2">
  <div className="rounded-lg">...</div>
</div>
```

> padding > 24px 时，内外视觉上已分离，可独立选圆角，不必严格套公式。

## 光学对齐

几何居中 ≠ 视觉居中。

### 按钮文字 + 图标

icon 侧 padding = 文字侧 padding − 2px。

```css
/* Good */
.button-with-icon { padding-left: 16px; padding-right: 14px; }

/* Bad — 等距看起来图标偏远 */
.button-with-icon { padding: 0 16px; }
```

```tsx
// Tailwind
<button className="pl-4 pr-3.5 flex items-center gap-2">
  <span>Continue</span><ArrowRightIcon />
</button>
```

### 播放按钮三角形

几何中心 ≠ 视觉中心，向右偏移 2px。

```css
.play-button svg { margin-left: 2px; }
```

### 不对称图标

优先在 SVG viewBox 里修正；退而求其次用 `ml-px`。

## Shadow 替代 Border

对卡片、按钮、容器的深度边框，用多层透明 `box-shadow` 代替 `border`。Shadow 基于透明度，适配任何背景色。

**不适用于分隔线**（`border-b`、`border-t`）——布局分隔仍用 border。

```css
:root {
  /* Light mode — 三层：1px ring + 微浮 + 环境深度 */
  --shadow-border:
    0px 0px 0px 1px rgba(0, 0, 0, 0.06),
    0px 1px 2px -1px rgba(0, 0, 0, 0.06),
    0px 2px 4px 0px rgba(0, 0, 0, 0.04);
  --shadow-border-hover:
    0px 0px 0px 1px rgba(0, 0, 0, 0.08),
    0px 1px 2px -1px rgba(0, 0, 0, 0.08),
    0px 2px 4px 0px rgba(0, 0, 0, 0.06);
}

/* Dark mode — 简化为单层白环 */
[data-theme="dark"] {
  --shadow-border: 0 0 0 1px rgba(255, 255, 255, 0.08);
  --shadow-border-hover: 0 0 0 1px rgba(255, 255, 255, 0.13);
}

.card {
  box-shadow: var(--shadow-border);
  transition-property: box-shadow;
  transition-duration: 150ms;
}
.card:hover { box-shadow: var(--shadow-border-hover); }
```

| 用 shadow | 用 border |
|-----------|-----------|
| 卡片、容器深度 | 列表分隔线 |
| 按钮边框样式 | 表格单元格边界 |
| 悬浮/下拉/模态 | 表单输入框轮廓（无障碍） |
| 多色背景上的元素 | 密集 UI 的细分割线 |

## 图片 Outline

1px 低透明度 outline 保持视觉深度一致。用 `outline` 而不是 `border`——不影响布局尺寸。

```css
img {
  outline: 1px solid rgba(0, 0, 0, 0.1);
  outline-offset: -1px;
}
[data-theme="dark"] img {
  outline-color: rgba(255, 255, 255, 0.1);
}
```

```tsx
// Tailwind
<img className="outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10" />
```
