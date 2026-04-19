# Typography Polish — 排版与数字细节

## text-wrap: balance

标题均匀分行，防孤字。仅 ≤6 行（Chromium）/ ≤10 行（Firefox）生效。

```css
h1, h2, h3 { text-wrap: balance; }
```

```tsx
// Tailwind
<h1 className="text-balance">标题文字</h1>
```

不要用在长段落上——超出行数限制会被浏览器忽略。

## text-wrap: pretty

防末行孤字，不均分行长。无行数限制，适合短中段落。

```css
p, li, figcaption, blockquote { text-wrap: pretty; }
```

```tsx
<p className="text-pretty">一段描述文字。</p>
```

| 场景 | 用什么 |
|------|--------|
| 标题 | `text-wrap: balance` |
| 短中段落、描述、UI 文字 | `text-wrap: pretty` |
| 长文（10+ 行）、代码块 | 都不加 |

## Font Smoothing (macOS)

macOS 默认渲染偏粗。在根元素加一次即可，其他平台会忽略。

```css
html {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

```tsx
<html className="antialiased">
```

不要逐元素加——会导致粗细不一致。

## Tabular Numbers

动态数字用等宽数字防布局抖动。

```css
.counter { font-variant-numeric: tabular-nums; }
```

```tsx
<span className="tabular-nums">{count}</span>
```

| 用 tabular-nums | 不用 |
|-----------------|------|
| 计数器、计时器 | 静态展示数字 |
| 动态价格 | 装饰性大数字 |
| 表格数字列 | 电话号、邮编、版本号 |
| 记分板、仪表盘 | |

> Inter 字体下 `1` 会变宽居中——这是预期行为，通常更利于对齐。

## 最小点击区

交互元素 ≥ 44×44px（WCAG）或至少 40×40px。小控件用伪元素扩展：

```css
.checkbox {
  position: relative;
  width: 20px; height: 20px;
}
.checkbox::after {
  content: "";
  position: absolute;
  top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 40px; height: 40px;
}
```

```tsx
// Tailwind
<button className="relative size-5 after:absolute after:top-1/2 after:left-1/2 after:size-10 after:-translate-1/2">
  <CheckIcon />
</button>
```

两个交互元素的点击区不能重叠——空间不够时缩小伪元素，但尽量大。
