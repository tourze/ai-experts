---
name: color-oklch-theory
description: 当用户要设计现代颜色系统、使用 OKLCH 色彩空间、做 tinted neutrals、处理暗色模式、应用 60-30-10 视觉权重规则或判断配色是否可访问时使用。适合"OKLCH 怎么用""如何选主色阶""暗色模式不是反转""纯黑纯白能不能用"等场景。
---

# OKLCH 颜色理论

## 适用场景

- 建立现代颜色 token 系统，从 HSL/hex 迁移到感知均匀空间。
- 需要生成色阶（5-9 级主色）且视觉步进一致。
- 设计 dark mode，避免"简单反转"套路。
- 诊断配色"看起来脏"或"不统一"的原因。
- 与 [design-system-patterns](../design-system-patterns/SKILL.md) 的 token 分层联动：本 skill 决定每个值**是什么**，它决定**怎么分层**。

## 核心约束

- **用 OKLCH，不用 HSL**：HSL 不感知均匀，50% lightness 的黄/蓝亮度完全不同。
- **纯黑 / 纯灰（chroma=0）/ 纯白禁用**：至少加 chroma 0.005-0.015。
- **极端亮度降 chroma**：接近白或黑时高 chroma 会炫目。
- **Neutrals 向品牌 hue 微偏**：chroma 0.005-0.015，潜意识拉近品牌与 UI。
- **60-30-10 是视觉权重，不是像素比**：accent 稀少才有力。
- **Dark mode ≠ 反转**：用"表面更亮"替代阴影，字重要减（light on dark 视觉更粗）。
- **Alpha 是设计异味**：透明度满天飞通常说明 palette 不完整。

## 实施步骤

1. **定品牌 hue**——从品牌来，不要反射伸手拿 `blue-600`（hue 250）或暖橙（hue 60）。
2. **造主色阶**——固定 hue，lightness 0.98→0.15 下行，chroma 在 0.55-0.65 亮度峰值（约 0.18-0.22），两端降。见 [references/oklch-scale-patterns.md](references/oklch-scale-patterns.md)。
3. **Tinted neutrals**——hue 跟品牌，chroma 0.005-0.015，几乎不可见但有效。
4. **60-30-10 分配**——60% surface / 30% 次要文本+边框 / 10% accent（CTA、焦点、状态）。
5. **Dark mode 独立设计**——重做一套 token，不要反转；表面分级用 lightness（15/20/25），字重减 50。

## 代码模式

### FAIL：HSL + 纯黑 + gray on color

```css
:root {
  --bg: #fff; --text: #000;
  --muted: #808080;           /* 零 chroma */
  --primary: hsl(250 80% 50%);
  --on-primary-bg: #808080;   /* gray on color，失活 */
}
```

→ HSL 步进不均；纯黑灰无色温显脏；gray 放主色背景直接 washed out。

### PASS：OKLCH + tinted neutrals

```css
:root {
  --brand-hue: 250;
  --brand:   oklch(0.55 0.18 var(--brand-hue));
  --brand-2: oklch(0.78 0.12 var(--brand-hue)); /* 极端亮度降 chroma */
  --surface: oklch(0.99 0.008 var(--brand-hue)); /* tinted neutral */
  --text:    oklch(0.22 0.01  var(--brand-hue));
  --on-brand:oklch(0.98 0.01  var(--brand-hue)); /* 不是 gray */
}
```

→ 感知均匀；neutrals 向品牌微偏；主色上文本用同 hue 浅色。完整 dark mode 示例见 references。

## 验证清单

- [ ] 全部 token 用 `oklch()`，无 hex、无 HSL（除 fallback）。
- [ ] 无 `#000` `#fff` chroma=0 的 neutral。
- [ ] Neutrals hue 跟品牌，chroma 0.005-0.015。
- [ ] 极端亮度（≥0.9 或 ≤0.2）chroma 已显式降低。
- [ ] 彩色背景上的文本用**同 hue** token，不是 gray。
- [ ] 60-30-10：accent 只在 CTA / 焦点 / 强状态。
- [ ] Dark mode 独立 token，非反转；表面分级用 lightness。
- [ ] Dark mode body 字重减 50（400→350）。
- [ ] WCAG：正文 ≥ 4.5:1，placeholder 也要 ≥ 4.5:1。
- [ ] `@supports not (color: oklch(0 0 0))` 给 Safari <15.4 兜底。

## 反模式

### FAIL: 纯黑当 dark bg

```css
.dark { --bg: #000; --surface: #111; --card: #222; }
/* 三层之间区分度极低，层级丢失 */
```

### PASS: lightness 阶梯

```css
.dark {
  --bg:      oklch(0.15 0.005 var(--brand-hue));
  --surface: oklch(0.18 0.008 var(--brand-hue));
  --card:    oklch(0.22 0.010 var(--brand-hue));
}
/* 层级清晰 + 微微暖偏 + 不刺眼 */
```

### FAIL: invert dark mode

```css
.dark { filter: invert(1); }
/* 图片也被反 / 颜色错乱 / 品牌色变成补色 */
```

### PASS: 独立 dark token

```css
[data-theme="dark"] {
  --color-brand: oklch(0.65 0.15 var(--brand-hue));  /* 暗模式品牌色单独调 */
  --color-text: oklch(0.92 0.01 var(--brand-hue));
}
/* 每个 token 独立设计，不是反转 */
```

### FAIL: 极端亮度堆 chroma

```css
--accent-light: oklch(0.95 0.25 250);  /* 接近白 + 高饱和 */
/* 视觉灼伤 / 打印失真 */
```

### PASS: 极端亮度降 chroma

```css
--accent-light: oklch(0.95 0.05 250);  /* 接近白 → chroma ≤ 0.05 */
--accent-dark:  oklch(0.20 0.08 250);  /* 接近黑 → chroma ≤ 0.10 */
```

## 参考资料

- [references/oklch-scale-patterns.md](references/oklch-scale-patterns.md) — 色阶配方 / dark mode 完整示例 / 色盲 / fallback
- [design-system-patterns](../design-system-patterns/SKILL.md)
- [web-design-guidelines](../web-design-guidelines/SKILL.md)
- [industry-design-presets](../industry-design-presets/SKILL.md)
