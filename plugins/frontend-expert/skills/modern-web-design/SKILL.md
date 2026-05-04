---
name: modern-web-design
description: 当用户需要规划或实现现代 Web 界面、按风格名称查询视觉特征与 CSS 落地、或选择行业视觉方向时使用。覆盖 2024-2025 设计趋势、60 种 UI 风格目录、品牌化落地页与性能优先界面。
---

# 现代 Web 设计

## 适用场景

- 设计或重构品牌官网、产品页、营销页、活动页和高辨识度 Web App 界面。
- 需要在"好看"和"快"之间做系统性平衡。
- 用户说"做成 X 风格"但不确定 X 具体长什么样、CSS 怎么写。
- 需要明确视觉方向，而不是套用通用模板。
- 用户提到 "premium"、"高级感"、"不要 AI 味" 时，先读取 [references/high-agency-protocol.md](references/high-agency-protocol.md)。
- 要给 AI 图像生成工具提供风格 prompt 关键词。
- 与 `industry-design-presets` 联动：preset 选风格，本 skill 落地。

## 风格选择方法

[references/styles-catalog.md](references/styles-catalog.md) 收录 60 种 UI 风格，每条含关键词、CSS 特征、适用/反适用、AI prompt 关键词、实现 checklist。

### 步骤

1. **按名称或氛围找候选**：查 styles-catalog.md
2. **过反适用清单**：banking/healthcare 禁用 Cyberpunk/Neubrutalism；每个风格都有 "Do Not Use For"
3. **落到 CSS 特征清单**：风格落地靠特征 checklist，不靠"氛围"
4. **不混搭 >2 种风格**：风格冲突是"AI 套版感"的主要来源

## 核心约束

- 性能优先：任何视觉方案都不能明显伤害 LCP、INP、CLS。
- 风格是一组约束，不是单个装饰特征。
- 默认满足可访问性：对比度、键盘、焦点、动效降级不是后补项。
- 不追热点式堆效果；玻璃、渐变、视差、滚动叙事都要有内容理由。
- 避免"AI 套版感"：系统字体堆、紫色渐变、均匀卡片墙、无差别圆角、装饰性噪音。
- 字体、色彩、网格、动效相互一致，围绕同一个概念服务。

## 代码模式

```css
:root {
  --color-surface: #f7f3eb;
  --color-text: #1d1b18;
  --color-accent: #d45a2c;
  --font-display: "Fraunces", serif;
  --font-body: "Public Sans", sans-serif;
}

.hero-title {
  font-family: var(--font-display);
  font-size: clamp(3rem, 7vw, 6rem);
  line-height: 0.92;
}
```

```tsx
// 先给出清晰结构，再叠加少量有意义的 reveal
<section className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
  <div>{/* 核心叙事 */}</div>
  <aside>{/* 支撑信息 / CTA */}</aside>
</section>
```

Glassmorphism 完整落地示例见 [references/styles-depth-glass.md](references/styles-depth-glass.md)。

## 检查清单

- [ ] 界面有一句能说清的视觉方向定义。
- [ ] 已查 styles-catalog.md 确认风格名称与实际特征匹配。
- [ ] 过了 "Do Not Use For" 反适用清单。
- [ ] CSS 特征清单中的关键特征全部落地（不是只挑 1-2 个）。
- [ ] 未混搭 > 2 种风格。
- [ ] 字体、色彩、网格、动效相互一致。
- [ ] 首屏优先级明确，核心 CTA 和核心叙事一眼可见。
- [ ] 视觉亮点不会牺牲可读性、可达性和响应速度。
- [ ] 动效数量克制，且有降级策略。
- [ ] 已通过 [性能诊断](../web-performance-diagnosis/SKILL.md) 复核。

## 反模式

### FAIL: AI 套版感

```tsx
<div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl">
  <h1>最好的 SaaS 解决方案</h1>
</div>
// 紫粉渐变 + 均匀圆角 + 空洞口号
```

### PASS: 有方向的视觉

```tsx
<section style={{ fontFamily: 'Fraunces, serif', backgroundColor: '#f7f3eb' }}>
  <h1 className="text-[clamp(3rem,7vw,6rem)] leading-[0.92]">销售每周省 6 小时</h1>
</section>
```

### FAIL: 三风格混搭

```css
.glass-card { backdrop-filter: blur(10px); }
.neu-button { box-shadow: inset 5px 5px 10px #000; }
.brutalist-section { border: 4px solid black; transform: rotate(-1deg); }
/* 三种语言互相打架 */
```

### PASS: 一页一风格

全局 Bento + 微 Glass 强调，不混入 Neumorphism / Brutalism / Cyberpunk。

### FAIL: 重型视觉无预算

LCP 1.5s → 6s，移动端卡死。

### PASS: 配性能预算

预算 LCP < 2.5s，JS < 300KB。hero 用渐变+静态图，滚动动效用 IntersectionObserver + CSS。

## 参考资料

- [web-performance-diagnosis](../web-performance-diagnosis/SKILL.md)、[interaction-design](../interaction-design/SKILL.md)、[responsive-design](../responsive-design/SKILL.md)
- [styles-catalog.md](references/styles-catalog.md) — 60 种 UI 风格与 CSS 落地特征
- [design_trends_2024.md](references/design_trends_2024.md)、[high-agency-protocol.md](references/high-agency-protocol.md)、[web-design-guidelines.md](references/web-design-guidelines.md)
- [interaction_patterns.md](references/interaction_patterns.md)、[performance_checklist.md](references/performance_checklist.md)、[accessibility_guide.md](references/accessibility_guide.md)
- [visual-design-foundations.md](references/visual-design-foundations.md)、[visual-brief-concretizer.md](references/visual-brief-concretizer.md)
- 脚本：`node scripts/design_audit.mjs`、`node scripts/pattern_generator.mjs`
