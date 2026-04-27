---
name: industry-design-presets
description: 当用户要为某个行业产品（SaaS、Fintech、Healthcare、E-commerce、Portfolio、Gen-Z、Gaming 等）挑选设计方向、风格、配色、字体组合，或判断某个行业不该用哪些视觉语言时使用。适合"我在做一个 X 产品，该用什么视觉""fintech 用什么色""healthcare 配色"等场景。
---

# 行业设计预设

## 适用场景

- 产品类型明确（fintech / healthcare / portfolio / gaming / spa 等），要快速锁定视觉方向。
- 需要同时决定 风格 + 配色 + 字体对 + 关键效果 + 反模式。
- 不知道某个行业"不该做什么"（比如 banking 忌 AI 紫粉渐变）。
- 要和 `ui-style-catalog`、[font-pairing-library](../font-pairing-library/SKILL.md)、[design-system-patterns](../design-system-patterns/SKILL.md) 联动。
- 详细预设查 [references/presets-catalog.md](references/presets-catalog.md)。

## 核心约束

- 预设是**起点不是终点**：先照表落 60%，剩余 40% 由品牌差异化决定。
- 行业语义先于视觉美感：banking 的首要情绪是"值得托付"，不是"酷"。
- 每个行业都有反模式——选之前先看"AVOID 清单"。
- 风格要和 `ui-style-catalog` 的 keywords 对齐，配色要和 [design-system-patterns](../design-system-patterns/SKILL.md) 的 token 对齐。
- 不机械套用：如果产品是 "B2B SaaS + Gen-Z 氛围"，按"主行业 + 次行业氛围"叠加，不用单 preset。

## 实施步骤

### 步骤 1：确定主行业 + 氛围词

查 [references/presets-catalog.md](references/presets-catalog.md) 找主行业 preset（如 Fintech）+ 1-2 个氛围词（trust / playful / luxury / technical）。

### 步骤 2：取出 5 要素

每个 preset 给出：**推荐风格 + 主色组 + 字体对 + 关键效果 + 反模式**。

### 步骤 3：接到设计系统

把"主色组"接入 [design-system-patterns](../design-system-patterns/SKILL.md) 的 semantic token；字体对接 [font-pairing-library](../font-pairing-library/SKILL.md)；风格实现细节查 `ui-style-catalog`。

## 代码模式

### FAIL：不查行业预设，banking 用 AI 渐变

```tsx
<section className="bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400">
  <h1>Modern Banking for the Next Generation</h1>
</section>
```

→ AI 紫粉渐变在 2024-2025 已成"廉价 AI 产品"符号；银行首要情绪是"稳重可托付"，这个渐变直接摧毁信任感。

### PASS：按 Fintech preset 落地

```css
:root {
  --color-brand: #1E3A8A;       /* Deep trust blue */
  --color-accent: #059669;      /* Growth green */
  --color-surface: #F8FAFC;
  --font-display: 'Inter', sans-serif;
  --font-body: 'Inter', sans-serif;
}
```

```tsx
<section className="bg-[var(--color-surface)] border-b border-slate-200">
  <h1 className="font-display font-semibold text-slate-900">
    Banking that earns your trust
  </h1>
</section>
```

→ 深蓝 + 增长绿是金融业界长期语义编码；低饱和表面 + 清晰层级 = 信任感；Inter 的几何感传递"现代+专业"。

## 验证清单

- [ ] 已挑出主行业 preset + 必要氛围词。
- [ ] 5 要素（风格 / 配色 / 字体 / 效果 / 反模式）全部确认，而非只挑喜欢的。
- [ ] 已检查 preset 的 **AVOID** 清单，没踩反模式。
- [ ] 配色接入了设计系统 semantic token，不是组件里硬写。
- [ ] 字体按 [font-pairing-library](../font-pairing-library/SKILL.md) 导入，不是每处自己写 `font-family`。
- [ ] 风格实现对照 `ui-style-catalog` 的 CSS 特征清单。

## 反模式

### FAIL: 跨行业套捷径

```
healthcare 应用使用 Gen-Z Neubrutalism：
- 高饱和荧光色 + 粗框 + 倾斜
→ 用户："这个看起来不专业，我不放心放医疗数据"
```

### PASS: 行业语义优先

```
healthcare：
- 主色：医疗蓝 / 信任绿（低饱和）
- 字体：Inter / Source Han Sans（清晰可读）
- 风格：克制留白，不堆装饰
→ 传递"安全、严谨、可信"
```

### FAIL: 100% 套预设

```
fintech 公司：完全照 Stripe 视觉
→ 与 10 个同行视觉一模一样 → 品牌识别度 0
```

### PASS: 60% 预设 + 40% 差异化

```
基础（60%）：fintech 标准（深蓝 + sans + 留白）
差异化（40%）：
- 独特图形语言（如品牌专属插画风格）
- 1 个标志性 motion pattern
- 内容语气与同行明显区分
```

## 参考资料

- [references/presets-catalog.md](references/presets-catalog.md) — 索引（指向下列分类文件）
- `ui-style-catalog`
- [font-pairing-library](../font-pairing-library/SKILL.md)
- [design-system-patterns](../design-system-patterns/SKILL.md)
