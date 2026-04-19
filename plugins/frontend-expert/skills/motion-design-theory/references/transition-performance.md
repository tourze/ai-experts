# Transition Performance — transition 属性纪律与 GPU 合成

## 禁 transition: all

永远不要用 `transition: all` 或 Tailwind 的 `transition`（映射到 `transition-property: all`）。只指定实际变化的属性。

### 为什么

- 浏览器被迫监视所有属性变化
- 导致意外动画（颜色、padding、阴影被连带过渡）
- 阻止浏览器优化

```css
/* Good */
.button {
  transition-property: scale, background-color;
  transition-duration: 150ms;
}

/* Bad */
.button { transition: all 150ms ease-out; }
```

```tsx
// Tailwind — Good
<button className="transition-[scale,background-color] duration-150 ease-out">

// Tailwind — Bad
<button className="transition duration-150 ease-out">
```

> Tailwind `transition-transform` 映射到 `transform, translate, scale, rotate`，只动 transform 时可用。多种非 transform 属性用方括号语法 `transition-[scale,opacity,filter]`。

## will-change 使用纪律

`will-change` 提示浏览器预提升元素到 GPU 合成层，避免首帧微卡。

### GPU 可合成属性表

| 属性 | GPU 可合成 | 值得用 will-change |
|------|-----------|-------------------|
| `transform` | Yes | Yes |
| `opacity` | Yes | Yes |
| `filter`（blur, brightness） | Yes | Yes |
| `clip-path` | Yes | Yes |
| `top`, `left`, `width`, `height` | No | No |
| `background`, `border`, `color` | No | No |

### 规则

```css
/* Good — 具体 GPU 属性 */
.card { will-change: transform, opacity; }

/* Bad — never */
.card { will-change: all; }

/* Bad — 非 GPU 属性无意义 */
.card { will-change: background-color, padding; }
```

- 只在观察到首帧卡顿时才加（Safari 尤其受益）
- 不要预防性地给每个动画元素加——每层消耗内存
- 现代浏览器已自带优化

## AnimatePresence initial={false}

对默认已展示的元素（图标切换、Tab、Toggle），加 `initial={false}` 跳过首次渲染时的入场动画。

```tsx
// Good — 首屏不动画，仅状态切换时动画
<AnimatePresence initial={false} mode="popLayout">
  <motion.span
    key={isActive ? "active" : "inactive"}
    initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
    exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
  >
    <Icon />
  </motion.span>
</AnimatePresence>
```

### 不要用在

依赖 `initial` 做首次入场动画的组件（如 stagger hero、loading 序列）——会跳过整个入场。

```tsx
// Bad — 会跳过 stagger 入场
<AnimatePresence initial={false}>
  <motion.div initial="hidden" animate="visible" variants={...}>
```

加 `initial={false}` 后务必刷新页面验证。
