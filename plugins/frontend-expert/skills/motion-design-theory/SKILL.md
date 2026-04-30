---
name: motion-design-theory
description: 当用户要设计 UI 动效、选择 easing/duration、处理 reduced-motion 或判断是否该加动画时使用。
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

## transition 与 will-change 纪律

详见 [references/transition-performance.md](references/transition-performance.md)：禁 `transition: all`；`will-change` 仅 GPU 属性；`AnimatePresence initial={false}` 跳过首屏。

## 验证清单

- [ ] 只动 `transform` / `opacity`（例外：grid-template-rows）。
- [ ] 无 `transition: all`，只指定实际变化属性。
- [ ] duration 来自 100/300/500 三档。
- [ ] 入场 > 退场（约 +25%）。
- [ ] easing 显式 `cubic-bezier`，无 bounce/elastic。
- [ ] Stagger 总时长 ≤ 500ms。
- [ ] 有 `prefers-reduced-motion` 降级。
- [ ] 首屏动画不阻塞 LCP。
- [ ] 默认态 `AnimatePresence` 用 `initial={false}`。
- [ ] `will-change` 仅 transform/opacity/filter。
- [ ] 无"遍地微动"。

## 反模式

### FAIL: 动 layout 属性 + bounce

```css
.modal {
  transition: width 400ms ease, top 400ms cubic-bezier(0.68,-0.55,0.27,1.55);
}
/* width/top 触发 layout 重排 / bounce 显廉价 / 无 reduced-motion */
```

### PASS: transform/opacity + 指数 + 降级

```css
.modal {
  transition: transform 240ms cubic-bezier(0.16,1,0.3,1),
              opacity 240ms;
}
@media (prefers-reduced-motion: reduce) {
  .modal { transition: opacity 150ms linear; transform: none; }
}
```

### FAIL: 入场 = 退场时长

```css
.dialog-enter, .dialog-exit { transition: 400ms; }
/* 退场拖沓，用户等待感强 */
```

### PASS: 退场快 25%

```css
.dialog-enter { transition: 240ms; }
.dialog-exit  { transition: 180ms; }
```

## 参考资料

- [references/easing-and-staggering.md](references/easing-and-staggering.md) — easing token 表 / stagger 配方 / accordion / FLIP / 场景 duration 对照
- [references/transition-performance.md](references/transition-performance.md) — transition 属性纪律 / will-change GPU 属性表 / initial={false} 用法
- [interaction-design](../interaction-design/SKILL.md)
- [lottie-animations](../lottie-animations/SKILL.md)
- [core-web-vitals](../core-web-vitals/SKILL.md)
