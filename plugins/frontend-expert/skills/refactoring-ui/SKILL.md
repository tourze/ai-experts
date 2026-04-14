---
name: refactoring-ui
description: 用于修复视觉层级、间距、颜色和深度问题。当用户说“界面看起来不对劲”“帮我调视觉层级”“Tailwind 样式太乱”“配色和间距需要整理”时使用。
license: MIT
metadata:
  author: wondelai
  version: "1.1.1"
---

# Refactoring UI

## 适用场景

- 页面“功能没问题，但看起来不专业”。
- 需要对表单、卡片、列表、导航、仪表盘做视觉整理。
- 需要建立更稳定的间距、字体、颜色和阴影规则。
- 需要用 Tailwind 或原生 CSS 快速拉齐设计质感。

## 核心约束

- 灰阶优先，色彩后置。先用层级、留白和字号解决结构问题。
- 设计靠约束，不靠灵感爆发； spacing、type、color、shadow 都要用固定尺度。
- 不要让每个元素都抢注意力。越重要的元素越少，越有力量。
- 正文宽度、表单宽度和分组间距必须收敛，不要默认拉满。
- 视觉优化不允许通过隐藏关键信息、弱化风险提示来达成“更干净”。

## 代码模式

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
}
```

```tsx
<div className="max-w-md space-y-6">
  <header className="space-y-2">
    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
      Billing
    </p>
    <h2 className="text-2xl font-semibold tracking-tight">升级到专业版</h2>
  </header>
</div>
```

## 检查清单

- [ ] 主次信息层级明显，标签不会和内容抢权重。
- [ ] 间距使用固定尺度，没有随手写的零散值。
- [ ] 正文宽度、表单宽度、卡片宽度都受约束。
- [ ] 文本颜色和背景颜色满足可读性，不靠纯黑和纯灰硬顶。
- [ ] 阴影和圆角的使用数量可控，服务层级而不是泛滥。

## 反模式

- 所有内容都居中，导致阅读路径断裂。
- 每个按钮都像主按钮，每段文案都像标题。
- 间距值到处都是 `13px`、`22px`、`37px` 之类的随机数。
- 过度依赖颜色区分层级，灰阶下立刻失效。
- 卡片、阴影、边框、装饰同时加满，页面越来越厚重。

## 参考资料

- [design-system-patterns](../design-system-patterns/SKILL.md)
- [frontend-design-review](../frontend-design-review/SKILL.md)
- [responsive-design](../responsive-design/SKILL.md)
- [references/advanced-patterns.md](references/advanced-patterns.md)
- [references/accessibility-depth.md](references/accessibility-depth.md)
- [references/animation-microinteractions.md](references/animation-microinteractions.md)
- [references/data-visualization.md](references/data-visualization.md)
- [references/theming-dark-mode.md](references/theming-dark-mode.md)
