---
name: ui-style-catalog
description: 当用户要按 UI 风格名称（Glassmorphism、Neubrutalism、Bento、Aurora、Claymorphism、Brutalism、Cyberpunk、Skeuomorphism 等）查询其视觉特征、CSS 特征、AI 生成 prompt 关键词、适用场景与反适用场景时使用。适合"这是什么风格""做成 Bento 风格""Glassmorphism 要怎么写 CSS"等场景。
---

# UI 风格目录

## 适用场景

- 用户说"做成 X 风格"但不确定 X 具体长什么样、CSS 怎么写。
- 要给 AI 图像生成工具提供风格 prompt 关键词。
- 审查现有界面是不是"套了风格没套对"。
- 与 [industry-design-presets](../../../frontend-expert/skills/industry-design-presets/SKILL.md) 联动——preset 给"选什么风格"，本 skill 给"风格怎么落地"。
- 40+ 风格明细查 [references/styles-catalog.md](references/styles-catalog.md)。

## 核心约束

- **风格是一组约束**，不是单个装饰特征。Glassmorphism ≠ 只有 `backdrop-filter`。
- 每个风格都有**反适用场景**——Neumorphism 不用于 a11y 敏感、Brutalism 不用于银行。
- 选风格前先过一遍"反适用"清单；再看 CSS 特征落地是否可行。
- 不要混搭超过 2 种风格——风格冲突是"AI 套版感"的主要来源。
- 和 [design-system-patterns](../../../frontend-expert/skills/design-system-patterns/SKILL.md) 的 token 对齐：圆角/阴影/色彩要统一。
- 给 AI 生图提供 prompt 关键词时用 `references/` 里的 "AI Prompt Keywords" 列，不要自创。

## 实施步骤

### 步骤 1：按名称或氛围找候选

查 [references/styles-catalog.md](references/styles-catalog.md)；每个风格条目包含：关键词、CSS 特征、适用、反适用、AI prompt 关键词、实现 checklist。

### 步骤 2：过反适用清单

如果产品是 banking、healthcare、accessibility-critical，先看"Do Not Use For"一栏。

### 步骤 3：落到 CSS 特征清单

风格落地不靠"氛围"，靠 CSS 特征 checklist。照着写。

## 代码模式

### FAIL：只抄 `backdrop-filter` 就声称 Glassmorphism

```css
.card { backdrop-filter: blur(10px); }
```

→ 没有 半透明背景、没有 边框微光、没有 彩色背景打底——玻璃效果失效，渲染为纯灰糊。

### PASS：按特征清单完整落地

```css
:root {
  --glass-bg: rgba(255, 255, 255, 0.08);
  --glass-border: rgba(255, 255, 255, 0.18);
}

.bg-gradient {
  background: radial-gradient(at 30% 20%, #8B5CF6 0%, transparent 40%),
              radial-gradient(at 80% 70%, #EC4899 0%, transparent 50%);
}

.card {
  background: var(--glass-bg);
  backdrop-filter: blur(16px) saturate(150%);
  -webkit-backdrop-filter: blur(16px) saturate(150%);
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}
```

→ 半透明 + 彩色背景 + 饱和 blur + 微边框 + 阴影，5 个特征一起才是 Glassmorphism。

## 验证清单

- [ ] 已查 references 确认风格名称与实际特征匹配。
- [ ] 过了"Do Not Use For"反适用清单，当前产品不在禁用范围。
- [ ] CSS 特征清单中的关键特征**全部**落地（不是只挑 1-2 个）。
- [ ] 未混搭 > 2 种风格。
- [ ] 圆角/阴影/色彩与 [design-system-patterns](../../../frontend-expert/skills/design-system-patterns/SKILL.md) 的 token 对齐。
- [ ] 如果给 AI 生图，prompt 关键词来自 references 的标准列表。

## 反模式

- 抄 1-2 个表面特征就声称"已经做成 X 风格"。
- 一个页面同时有 Glass + Neumorphism + Brutalism，三风格打架。
- 风格选对了但忽略"反适用"——例如银行做 Cyberpunk。
- 给 AI 生图时 prompt 关键词自创，结果图风不稳定。
- 把风格当装饰套用，没改字体/间距/圆角 token。

## 参考资料

- [references/styles-catalog.md](references/styles-catalog.md) — 40+ 风格明细索引
- [industry-design-presets](../../../frontend-expert/skills/industry-design-presets/SKILL.md)
- [design-system-patterns](../../../frontend-expert/skills/design-system-patterns/SKILL.md)
- [modern-web-design](../../../frontend-expert/skills/modern-web-design/SKILL.md)
