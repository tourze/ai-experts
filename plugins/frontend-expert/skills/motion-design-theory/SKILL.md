---
name: motion-design-theory
description: 当用户要设计 UI 动效、选 easing 曲线、定 duration、处理 reduced-motion 或判断"该不该加动画"时使用。适合"动画节奏怎么定""用哪条 cubic-bezier""什么时候不该动画""为什么 bounce 过时了"等场景。
---

# UI 运动设计理论

## 适用场景

- 定 UI 运动系统：duration 档位、easing token、交错节奏。
- 诊断"动画感觉廉价 / 迟钝 / 炫技"的具体原因。
- accordion / modal / drawer / list reveal / 页面切换选曲线。
- 与 [lottie-animations](../lottie-animations/SKILL.md)、[interaction-design](../interaction-design/SKILL.md) 分工。

## 核心约束

- **只动 `transform` 和 `opacity`**：其他属性触发 layout/paint。Height 动画用 `grid-template-rows: 0fr → 1fr`。
- **100 / 300 / 500 规则**：100-150ms 即时反馈；200-300ms 状态切换；300-500ms 布局变化；500-800ms 入场。超 800ms 阻塞。
- **Exit 比 Enter 快 25%**：退场 150ms vs 入场 200ms。
- **禁 `ease` 默认**：浏览器 `ease` 前慢后慢不自然，显式选指数曲线。
- **禁 bounce / elastic**：2015 年流行，现在显廉价；真实物体只减速不弹。
- **`prefers-reduced-motion` 不是可选**：35% 40+ 成年人前庭敏感；必须降级。
- **一次高光胜过遍地微动**。

## 实施步骤

1. 决定 motion 意图：状态切换？反馈？入场？强调？
2. 选 duration 档位（100/300/500 规则）。
3. 选 easing 曲线（见 [references/easing-and-staggering.md](references/easing-and-staggering.md)）。
4. 只用 transform + opacity；height 改 grid-template-rows。
5. 写 `prefers-reduced-motion` 降级。

## 代码模式

### FAIL：ease + bounce + 动 layout + 无降级

```css
.modal {
  transition: top 400ms ease, width 400ms ease,
              transform 400ms cubic-bezier(0.68, -0.55, 0.27, 1.55);
}
```

→ `top`/`width` 触发 layout 掉帧；`ease` 前后都慢；bounce 显廉价；无 reduced-motion。

### PASS：transform+opacity + 指数曲线 + 降级

```css
:root {
  --ease-out-quart: cubic-bezier(0.25, 1, 0.5, 1);
  --ease-out-expo:  cubic-bezier(0.16, 1, 0.3, 1);
  --dur-fast: 150ms; --dur-base: 240ms; --dur-slow: 400ms;
}
.modal {
  transition: transform var(--dur-slow) var(--ease-out-expo),
              opacity   var(--dur-slow) var(--ease-out-quart);
}
.modal[data-state="closed"] { transform: scale(0.96); opacity: 0; }
.modal[data-state="open"]   { transform: scale(1);    opacity: 1; }

@media (prefers-reduced-motion: reduce) {
  .modal { transition: opacity var(--dur-fast) linear; transform: none; }
}
```

→ 只触发合成层；入场指数减速；reduced-motion 下只留淡入。Accordion / FLIP 配方见 references。

## 验证清单

- [ ] transition / animation 只动 `transform` / `opacity`（例外：grid-template-rows）。
- [ ] duration 来自 100 / 300 / 500 三档 token，不写 `178ms` 奇数。
- [ ] 入场 duration > 退场 duration（约 +25%）。
- [ ] easing 用显式 `cubic-bezier`，不用默认 `ease` 做 UI 收尾。
- [ ] 无 bounce / elastic 曲线。
- [ ] Stagger 总时长 ≤ 500ms，项多时降 per-item delay。
- [ ] 每条动画都有 `prefers-reduced-motion` 降级。
- [ ] 首屏动画不阻塞 LCP。
- [ ] 无"遍地微动"——ambient loop 不超过 1 个且可关。

## 反模式

- `transition: all`——未来属性全被动画，性能崩。
- 动 `width` / `height` / `top` / `left`——每帧 layout recalc。
- `cubic-bezier(0.68, -0.55, 0.27, 1.55)` 这种 bounce/elastic。
- 默认 `ease`——前慢后慢，感觉沉。
- 同页 10 种不同 duration + easing——风格不统一。
- 入场退场用相同 duration——退场应更快。
- stagger 每项 100ms × 20 项 = 2 秒总时长。
- 纯装饰 ambient loop（背景粒子永动）——耗电、伤 reduced-motion。
- 忽略 `prefers-reduced-motion`——WCAG 2.3.3 违规。

## 参考资料

- [references/easing-and-staggering.md](references/easing-and-staggering.md) — easing token 表 / stagger 配方 / accordion / FLIP / 场景 duration 对照
- [interaction-design](../interaction-design/SKILL.md)
- [lottie-animations](../lottie-animations/SKILL.md)
- [core-web-vitals](../core-web-vitals/SKILL.md)
