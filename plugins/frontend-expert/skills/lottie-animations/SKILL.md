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
python3 ./scripts/optimize_lottie.py ./animation.json -o ./animation.optimized.json
python3 ./scripts/generate_lottie_component.py --framework react --type interactive --name HeroAnimation
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

- 把大体积营销动画塞进首屏阻塞 LCP。
- 页面上同时自动播放多个循环动画。
- 在滚动列表中为每一项都实例化复杂 Lottie。
- 直接把未压缩 JSON 上线。
- 用 Lottie 替代本应由 CSS 完成的简单 hover / loading。

## 参考资料

- [interaction-design](../interaction-design/SKILL.md)
- [modern-web-design](../modern-web-design/SKILL.md)
- [scripts/generate_lottie_component.py](scripts/generate_lottie_component.py)
- [scripts/optimize_lottie.py](scripts/optimize_lottie.py)
- [references/performance_guide.md](references/performance_guide.md)
- [references/api_reference.md](references/api_reference.md)
- [references/after_effects_export.md](references/after_effects_export.md)
