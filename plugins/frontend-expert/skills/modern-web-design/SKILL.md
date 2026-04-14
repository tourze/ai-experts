---
name: modern-web-design
description: 用于规划和实现 2024-2025 风格的现代 Web 界面。当用户提到现代网页设计、品牌化落地页、性能优先界面、微交互、叙事滚动或高级视觉方向时使用。
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
python3 ./scripts/design_audit.py --file ./index.html
```

## 检查清单

- [ ] 界面有一句能说清的视觉方向定义。
- [ ] 字体、色彩、网格、动效相互一致，不互相打架。
- [ ] 首屏优先级明确，核心 CTA 和核心叙事一眼可见。
- [ ] 视觉亮点不会牺牲可读性、可达性和响应速度。
- [ ] 动效数量克制，且有降级策略。
- [ ] 已通过 [core-web-vitals](../core-web-vitals/SKILL.md) 和 [web-design-guidelines](../web-design-guidelines/SKILL.md) 复核。

## 反模式

- 所有设计决策都交给“默认值”。
- 页面每一屏都想成为主视觉，导致信息密度失控。
- 只会复制 Dribbble 风格，不关心真实内容与业务目标。
- 使用高频动画、视频背景和重型视觉效果，却不做性能预算。
- 把“现代”理解成更多毛玻璃、更多渐变、更多阴影。

## 参考资料

- [core-web-vitals](../core-web-vitals/SKILL.md)
- [interaction-design](../interaction-design/SKILL.md)
- [responsive-design](../responsive-design/SKILL.md)
- [web-design-guidelines](../web-design-guidelines/SKILL.md)
- [scripts/design_audit.py](scripts/design_audit.py)
- [scripts/pattern_generator.py](scripts/pattern_generator.py)
- [references/design_trends_2024.md](references/design_trends_2024.md)
- [references/interaction_patterns.md](references/interaction_patterns.md)
- [references/performance_checklist.md](references/performance_checklist.md)
- [references/accessibility_guide.md](references/accessibility_guide.md)
