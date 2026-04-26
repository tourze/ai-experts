---
name: modern-web-design
description: 当用户需要规划或实现 2024-2025 风格的现代 Web 界面时使用。适合涉及现代网页设计、品牌化落地页、性能优先界面、微交互、叙事滚动或高级视觉方向的场景。
---

# 现代 Web 设计

## 适用场景

- 设计或重构品牌官网、产品页、营销页、活动页和高辨识度 Web App 界面。
- 需要在“好看”和“快”之间做系统性平衡。
- 需要明确视觉方向，而不是套用通用模板。
- 需要构建一套现代网页的设计与实现判断框架。

## 核心约束

- 性能优先：任何视觉方案都不能明显伤害 LCP、INP、CLS。
- 风格优先级明确：字体、色彩、版式、动效必须围绕同一个概念服务。
- 默认满足可访问性：对比度、键盘、焦点、动效降级不是后补项。
- 不追热点式堆效果；玻璃、渐变、视差、滚动叙事都要有内容理由。
- 避免“AI 套版感”：系统字体堆、紫色渐变、均匀卡片墙、无差别圆角、装饰性噪音。

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

```bash
python3 ./scripts/pattern_generator.py --pattern hero
node ./scripts/design_audit.mjs --file ./index.html
```

## 检查清单

- [ ] 界面有一句能说清的视觉方向定义。
- [ ] 字体、色彩、网格、动效相互一致，不互相打架。
- [ ] 首屏优先级明确，核心 CTA 和核心叙事一眼可见。
- [ ] 视觉亮点不会牺牲可读性、可达性和响应速度。
- [ ] 动效数量克制，且有降级策略。
- [ ] 已通过 [core-web-vitals](../core-web-vitals/SKILL.md) 和 [web-design-guidelines](../web-design-guidelines/SKILL.md) 复核。

## 反模式

### FAIL: AI 套版感

```tsx
<div className=”bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-xl”>
  <h1>最好的 SaaS 解决方案</h1>
  <p>致力于为企业提供智能化的效率提升</p>
</div>
// 紫粉渐变 + 均匀圆角 + 空洞口号 → AI 生成感
```

### PASS: 有方向的视觉

```tsx
<section style={{ fontFamily: 'Fraunces, serif', backgroundColor: '#f7f3eb' }}>
  <h1 className=”text-[clamp(3rem,7vw,6rem)] leading-[0.92]”>
    销售每周省 6 小时
  </h1>
  <p>自动化报表 · 真实客户数据</p>
</section>
```

### FAIL: 重型视觉无预算

```tsx
<VideoBackground src=”/hero-4k.mp4” autoPlay loop />
<ParallaxSection />
// LCP 1.5s → 6s，移动端卡死
```

### PASS: 配性能预算

```
预算：LCP < 2.5s，JS < 300KB
- hero 用渐变+静态图
- 滚动动效用 IntersectionObserver + CSS
- 重型效果仅桌面 + prefers-reduced-motion 降级
```

## 参考资料

- [core-web-vitals](../core-web-vitals/SKILL.md)
- [interaction-design](../interaction-design/SKILL.md)
- [responsive-design](../responsive-design/SKILL.md)
- [web-design-guidelines](../web-design-guidelines/SKILL.md)
- [scripts/design_audit.mjs](scripts/design_audit.mjs)
- [scripts/pattern_generator.py](scripts/pattern_generator.py)
- [references/design_trends_2024.md](references/design_trends_2024.md)
- [references/interaction_patterns.md](references/interaction_patterns.md)
- [references/performance_checklist.md](references/performance_checklist.md)
- [references/accessibility_guide.md](references/accessibility_guide.md)
