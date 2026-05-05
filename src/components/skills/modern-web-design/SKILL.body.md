## 风格选择方法

[references/styles-catalog.md](references/styles-catalog.md) 收录 60 种 UI 风格，每条含关键词、CSS 特征、适用/反适用、AI prompt 关键词、实现 checklist。

### 步骤

1. **按名称或氛围找候选**：查 styles-catalog.md
2. **过反适用清单**：banking/healthcare 禁用 Cyberpunk/Neubrutalism；每个风格都有 "Do Not Use For"
3. **落到 CSS 特征清单**：风格落地靠特征 checklist，不靠"氛围"
4. **不混搭 >2 种风格**：风格冲突是"AI 套版感"的主要来源

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

## 参考资料

- [styles-catalog.md](references/styles-catalog.md) — 60 种 UI 风格与 CSS 落地特征
- [design_trends_2024.md](references/design_trends_2024.md)、[high-agency-protocol.md](references/high-agency-protocol.md)、[web-design-guidelines.md](references/web-design-guidelines.md)
- [interaction_patterns.md](references/interaction_patterns.md)、[performance_checklist.md](references/performance_checklist.md)、[accessibility_guide.md](references/accessibility_guide.md)
- [visual-design-foundations.md](references/visual-design-foundations.md)、[visual-brief-concretizer.md](references/visual-brief-concretizer.md)
- 脚本：`node scripts/design_audit.mjs`、`node scripts/pattern_generator.mjs`
