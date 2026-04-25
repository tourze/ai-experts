---
name: lottie-animations
description: 当任务涉及 Lottie / dotLottie 动画、lottie-web、After Effects 导出动画、交互动效图标、加载动画或 Lottie 性能优化时使用。
---

# Lottie 动画

## 适用场景

- 需要实现由设计师导出的动效图标、加载动画、引导动画或宣传动画。
- 需要在 React、Vue、Svelte 或原生 Web 中嵌入 `.json` / `.lottie` 动画。
- 需要压缩 Lottie 体积、生成组件模板或做性能治理。

## 核心约束

- 生产环境优先 `dotLottie`，体积更小，便于多动画封装。
- 先判断动画是否真的需要；简单状态切换优先用 CSS 或 SVG。
- 自动播放只给关键场景，且要支持暂停、停止或降级。
- 所有动画都要兼容 `prefers-reduced-motion`，避免持续干扰。
- 文件体积和实例数量要可控，长列表里不要同时挂很多动画实例。
- 可联动 [interaction-design](../interaction-design/SKILL.md) 做更完整的状态反馈设计。

## 代码模式

```tsx
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

export function LoadingAnimation() {
  return <DotLottieReact src="/animations/loading.lottie" loop autoplay style={{ height: 120 }} />;
}
```

```bash
node ./scripts/optimize_lottie.mjs ./animation.json -o ./animation.optimized.json
node ./scripts/generate_lottie_component.mjs --framework react --type interactive --name HeroAnimation
```

```css
@media (prefers-reduced-motion: reduce) {
  .hero-lottie {
    display: none;
  }
}
```

## 检查清单

- [ ] 已确认场景需要 Lottie，而不是 CSS/SVG 即可完成。
- [ ] 已优先使用 `.lottie` 或压缩后的 JSON。
- [ ] 动画有明确触发条件与停止条件。
- [ ] 已验证内存、CPU 与低端设备表现。
- [ ] 已处理降级和 `prefers-reduced-motion`。
- [ ] React/Vue/Svelte 示例与当前脚本参数保持一致。

## 反模式

### FAIL: Lottie 替代 CSS 简单态

```tsx
// 一个简单的 hover 缩放
<Lottie src="/hover-bounce.json" />  // 12KB JSON + lottie-web 80KB runtime
```

### PASS: CSS 即可

```tsx
<button className="transition-transform hover:scale-105">
// 0 KB 额外资源，原生加速
```

### FAIL: 首屏 LCP 阻塞

```tsx
<HeroSection>
  <Lottie src="/hero-animation.json" autoplay loop /> {/* 800KB */}
</HeroSection>
// LCP 从 1.5s 飙到 5s，移动端跳出率翻倍
```

### PASS: 动画延迟到首屏后

```tsx
const Lottie = lazy(() => import('@lottiefiles/dotlottie-react'));

<HeroSection>
  <img src="/hero-static.webp" /> {/* LCP 元素 */}
  <Suspense>
    <Lottie src="/hero.lottie" autoplay /> {/* 首屏后渐进增强 */}
  </Suspense>
</HeroSection>
```

### FAIL: 列表每项实例化

```tsx
{items.map(i => (
  <li>
    <Lottie src="/badge.json" autoplay loop />  {/* 100 个实例 */}
    {i.title}
  </li>
))}
// 主线程帧时间 50ms+，滚动卡死
```

### PASS: 单实例 + 静态降级

```tsx
{items.map(i => (
  <li>
    <img src="/badge-static.svg" />  {/* SVG 静态图替代 */}
    {i.title}
  </li>
))}
// 仅在 hover 或 focus 单独实例化动画
```

## 参考资料

- [interaction-design](../interaction-design/SKILL.md)
- [modern-web-design](../modern-web-design/SKILL.md)
- [scripts/generate_lottie_component.mjs](scripts/generate_lottie_component.mjs)
- [scripts/optimize_lottie.mjs](scripts/optimize_lottie.mjs)
- [references/performance_guide.md](references/performance_guide.md)
- [references/api_reference.md](references/api_reference.md)
- [references/after_effects_export.md](references/after_effects_export.md)
