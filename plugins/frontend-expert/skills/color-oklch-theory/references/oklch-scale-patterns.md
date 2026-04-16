# OKLCH 色阶配方 & Dark Mode 完整示例

## OKLCH 语法

```
oklch(<lightness> <chroma> <hue>)
  lightness: 0-1 (或 0%-100%)  感知亮度，0=黑 / 1=白
  chroma:    0-0.4           饱和度，0=无色
  hue:       0-360           色相：0 红 / 60 橙-黄 / 120 绿 / 180 青 / 250 蓝 / 300 紫 / 330 粉
```

## 主色 9 级阶（固定 hue，lightness 下行）

以品牌 hue=250（蓝）为例：

| 级 | lightness | chroma | OKLCH |
|---|---|---|---|
| 50 | 0.97 | 0.020 | `oklch(0.97 0.020 250)` |
| 100 | 0.94 | 0.040 | `oklch(0.94 0.040 250)` |
| 200 | 0.88 | 0.080 | `oklch(0.88 0.080 250)` |
| 300 | 0.78 | 0.120 | `oklch(0.78 0.120 250)` |
| 400 | 0.68 | 0.160 | `oklch(0.68 0.160 250)` |
| **500** (base) | **0.58** | **0.180** | `oklch(0.58 0.180 250)` |
| 600 | 0.48 | 0.170 | `oklch(0.48 0.170 250)` |
| 700 | 0.38 | 0.140 | `oklch(0.38 0.140 250)` |
| 800 | 0.28 | 0.110 | `oklch(0.28 0.110 250)` |
| 900 | 0.20 | 0.080 | `oklch(0.20 0.080 250)` |

**规律**：lightness 近 0 或 1 时 chroma 降；中段（0.5-0.65）chroma 峰值。

**不同 hue 的峰值 chroma**（饱和度物理上限）：
- 黄 (90) / 橙 (60)：可到 0.22
- 红 (20) / 粉 (340)：0.20
- 蓝 (250) / 紫 (290)：0.18
- 青 (200) / 绿 (140)：0.20-0.22

## Tinted Neutrals 11 级（品牌 hue，极低 chroma）

```css
:root {
  --brand-hue: 250;
  --n-0:  oklch(1.00 0     0);                   /* 纯白兜底 */
  --n-50: oklch(0.985 0.004 var(--brand-hue));
  --n-100:oklch(0.97  0.006 var(--brand-hue));
  --n-200:oklch(0.92  0.008 var(--brand-hue));
  --n-300:oklch(0.85  0.010 var(--brand-hue));
  --n-400:oklch(0.68  0.012 var(--brand-hue));
  --n-500:oklch(0.55  0.010 var(--brand-hue));
  --n-600:oklch(0.42  0.010 var(--brand-hue));
  --n-700:oklch(0.30  0.010 var(--brand-hue));
  --n-800:oklch(0.20  0.008 var(--brand-hue));
  --n-900:oklch(0.14  0.008 var(--brand-hue));
}
```

## Semantic 颜色（按意义选 hue）

```css
:root {
  --success: oklch(0.60 0.17 150);  /* 绿 */
  --warning: oklch(0.75 0.16 85);   /* 琥珀 */
  --danger:  oklch(0.58 0.20 25);   /* 红橙 */
  --info:    oklch(0.65 0.12 230);  /* 浅蓝 */
}
```

确保这 4 个色在色盲测试下可区分（红/绿是关键风险——不能用形状或图标唯一编码依赖之）。

## 完整 Dark Mode 示例

```css
:root {
  /* Light mode */
  --brand-hue: 250;
  --surface:   oklch(0.99 0.008 var(--brand-hue));
  --surface-2: oklch(0.96 0.008 var(--brand-hue));
  --text:      oklch(0.22 0.01  var(--brand-hue));
  --text-muted:oklch(0.55 0.01  var(--brand-hue));
  --border:    oklch(0.92 0.008 var(--brand-hue));
  --brand:     oklch(0.55 0.18  var(--brand-hue));
  --on-brand:  oklch(0.98 0.01  var(--brand-hue));
}

[data-theme="dark"] {
  /* 不反转：重做 */
  --surface:   oklch(0.16 0.01 var(--brand-hue));
  --surface-2: oklch(0.20 0.01 var(--brand-hue));  /* 更亮=更高层 */
  --surface-3: oklch(0.25 0.01 var(--brand-hue));
  --text:      oklch(0.92 0.01 var(--brand-hue));
  --text-muted:oklch(0.68 0.01 var(--brand-hue));
  --border:    oklch(0.28 0.01 var(--brand-hue));
  --brand:     oklch(0.70 0.14 var(--brand-hue));  /* 暗色下 desat */
  --on-brand:  oklch(0.15 0.01 var(--brand-hue));
}

/* Light on dark 视觉更粗，body 字重减 */
body { font-weight: 400; }
[data-theme="dark"] body { font-weight: 350; }

/* 用 CSS light-dark() 简化（Chrome 123+ / Firefox 120+ / Safari 17.5+） */
@supports (color: light-dark(#fff, #000)) {
  :root { color-scheme: light dark; }
  /* 这里可改用 light-dark() 函数 */
}
```

## 60-30-10 视觉权重的落地

不是像素比，是**眼球停留**：

- **60% Surface**：大块背景、卡片、表格单元 → 用 `--surface`、`--surface-2`
- **30% 次要**：文本、边框、禁用态 → 用 `--text-muted`、`--border`
- **10% Accent**：CTA、focus ring、状态徽章 → 用 `--brand`、`--success` 等

**常见错误**：把 `--brand` 当"主色"塞满页面（按钮、链接、徽章、标题、边框都用）。此时 accent 变"色块填充"，失去注意力锚定作用。

## 色盲可读性

8% 男性 / 0.5% 女性有色盲，最常见是红绿色盲（Deuteranopia / Protanopia）。

- 测试：Chrome DevTools → Rendering → Emulate vision deficiencies
- 原则：**颜色不是唯一信息通道**——加图标、形状或文字区分
- 红/绿配对高风险：用**深红 + 亮绿** + 图标；或直接换 蓝/橙对

## 浏览器兼容 & Fallback

OKLCH 支持：Safari 15.4+ / Chrome 111+ / Firefox 113+（2023 起主流浏览器全支持）。

给更老浏览器兜底：

```css
:root {
  --brand: #2563eb;                        /* hex fallback 在前 */
  --brand: oklch(0.55 0.18 250);           /* OKLCH 覆盖 */
}

/* 或用 @supports 显式分叉 */
@supports (color: oklch(0.5 0.1 250)) {
  :root { --brand: oklch(0.55 0.18 250); }
}
@supports not (color: oklch(0.5 0.1 250)) {
  :root { --brand: #2563eb; }
}
```

实践：第一种"后续属性覆盖"足够；不支持的浏览器会忽略第二行，自然 fallback 到 hex。

## 工具

- [oklch.com](https://oklch.com) — 可视化选色器，HSL/hex 转 OKLCH
- [huetone.ardov.me](https://huetone.ardov.me) — 色阶均衡 + WCAG 对比可视化
- Chrome DevTools：Color Picker 支持 OKLCH 模式

## 致谢

OKLCH 理论参考 `pbakaus/impeccable` (Apache-2.0) 的 color-and-contrast reference，色阶配方和 dark mode 完整示例经过重写与扩充，加入了色盲/fallback/hue 峰值 chroma 对照表。
