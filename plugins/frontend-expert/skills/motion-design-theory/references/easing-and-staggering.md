# Easing 曲线、Stagger 节奏 & 场景配方

## Easing Token 完整表

### 推荐指数曲线（cubic-bezier 具体值）

```css
:root {
  /* 入场用 out（对象到位） */
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);    /* 平顺 · 推荐默认 */
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);   /* 略戏剧 */
  --ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);    /* 快速收敛 · 自信 */

  /* 退场用 in（对象离开） */
  --ease-in-quart:  cubic-bezier(0.5, 0, 0.75, 0);
  --ease-in-expo:   cubic-bezier(0.7, 0, 0.84, 0);

  /* 往返 / toggle 状态 */
  --ease-in-out-quart: cubic-bezier(0.65, 0, 0.35, 1);

  /* 线性仅限 loading / progress */
  --ease-linear: linear;
}
```

### 各场景推荐曲线

| 场景 | Easing | Duration |
|---|---|---|
| 按钮按下反馈 | linear 或 ease-out-quart | 100ms |
| Hover 反馈（颜色/阴影） | ease-out-quart | 150ms |
| Focus ring 显现 | ease-out-expo | 150ms |
| Tooltip 出现 | ease-out-quart | 200ms |
| Dropdown / Select 展开 | ease-out-quart | 200ms |
| Tab 切换（内容淡入淡出） | ease-out-quart | 200ms |
| Toast 滑入 | ease-out-expo | 300ms |
| Modal 入场 | ease-out-expo | 400ms |
| Drawer 抽屉 | ease-out-quart | 300ms |
| Accordion 展开（grid-rows） | ease-out-quart | 240ms |
| 页面路由切换 | ease-out-quart | 300ms |
| Hero 入场（staggered） | ease-out-quart | 500-700ms |
| 全屏 loading / skeleton | linear | 1200ms loop |
| Progress bar 填充 | linear | 跟随进度 |

## Duration Token

```css
:root {
  --dur-fast:   150ms;  /* 即时反馈 */
  --dur-base:   240ms;  /* 默认状态切换 */
  --dur-slow:   400ms;  /* 布局 / modal */
  --dur-slower: 700ms;  /* 入场 / hero */
}
```

不写 `178ms` / `330ms` 这种奇数——用 token 强制节奏一致。

## Enter / Exit 非对称

```css
.modal                    { transition: var(--dur-slow) var(--ease-out-expo); }
.modal[data-state="closed"]{ transition: var(--dur-base) var(--ease-in-quart); }
```

入场 400ms + ease-out（对象到位要稳）；退场 240ms + ease-in（用户想快速关）。

## Stagger（交错入场）

### CSS 实现

```css
.stagger-item {
  opacity: 0;
  transform: translateY(12px);
  animation: fadeUp 500ms var(--ease-out-quart) forwards;
  animation-delay: calc(var(--i, 0) * 50ms);
}
@keyframes fadeUp { to { opacity: 1; transform: none; } }
```

```html
<li class="stagger-item" style="--i: 0">A</li>
<li class="stagger-item" style="--i: 1">B</li>
<li class="stagger-item" style="--i: 2">C</li>
```

### Stagger 总时长封顶

```text
Total = base_duration + (n - 1) × per_item_delay
500  + (20 - 1) × 50 = 1450ms  ← 太长！用户已走神

当 n > 10，per-item delay 要降：
- n ≤ 6  → 80ms
- 6-10   → 50ms
- 11-20  → 25ms
- > 20   → 考虑分批 / 视口内才触发
```

## Accordion（不动 height）

```css
.acc-content {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--dur-base) var(--ease-out-quart);
}
.acc[data-state="open"] .acc-content { grid-template-rows: 1fr; }
.acc-content > div { overflow: hidden; }
```

`grid-template-rows: 0fr → 1fr` 是 Web 2023 后的技术，浏览器可原生过渡，不需要 JS 测量 scrollHeight。

## FLIP（First-Last-Invert-Play）

列表重排、图片放大到 lightbox 等"位置变化"动画，用 FLIP：

```js
// First: 记录初始 bounding rect
const first = el.getBoundingClientRect();
// Last: 改变 DOM / class（位置变了）
container.appendChild(el);
const last = el.getBoundingClientRect();
// Invert: 用 transform 让它"回到"原位
const dx = first.left - last.left;
const dy = first.top  - last.top;
el.animate(
  [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
  { duration: 400, easing: 'cubic-bezier(0.25, 1, 0.5, 1)' }
);
// Play: 浏览器自动播放
```

优点：实际位置用普通 DOM 操作，只有 transform 动；60fps 稳定。

## Reduced Motion 降级

```css
@media (prefers-reduced-motion: reduce) {
  /* 策略 1：duration 归零（瞬间切换） */
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }

  /* 策略 2：保留淡入（更温和），但去掉位移 */
  .fade-up { animation: none; opacity: 1; transform: none; }
}
```

前端库（Framer Motion / GSAP）都有对应的 reduced-motion helper，优先用它们的 API。

## 性能速查

| 属性 | 触发 | 可动画？ |
|---|---|---|
| `transform` | composite only | ✅ |
| `opacity` | composite only | ✅ |
| `filter` | paint + composite | ✅（少量） |
| `clip-path` | paint | ⚠️（简单形状 OK） |
| `background-color` | paint | ⚠️（短时 OK） |
| `width` / `height` | layout | ❌ |
| `top` / `left` / `right` / `bottom` | layout | ❌ |
| `margin` / `padding` | layout | ❌ |
| `grid-template-rows / -columns` | layout | ⚠️（0fr↔1fr 技巧除外） |

## Motion 的"少即是多"

- 一个页面：**1 个高光动画**（hero reveal / 路由切换），其他全用最小反馈动画。
- Dashboard / 工具类产品：**几乎不要入场动画**——用户来是做事的，不是看表演。
- 营销页 / 作品集：**可以给 1-2 个强编排动画**，但要和内容节奏匹配。
- Loop 动画：**最多 1 个**（如 hero 背景），且必须可被 reduced-motion 关。

## 致谢

本文档参考 `pbakaus/impeccable` (Apache-2.0) 的 motion-design reference，cubic-bezier 数值和 100/300/500 规则来自该项目，stagger 封顶规则、场景配方表、FLIP 示例为本项目补充。
