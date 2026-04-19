---
name: refactoring-ui
description: 当用户需要修复视觉层级、间距、颜色或深度问题时使用。适合”界面看起来不对劲””帮我调视觉层级””Tailwind 样式太乱””配色和间距需要整理”等场景。
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

## 视觉细节打磨

以下规则针对"功能没问题但看起来不对"的常见原因，详见 [references/surface-polish.md](references/surface-polish.md)：

- **同心圆角**：`outerRadius = innerRadius + padding`，内外圆角相同是最常见的"看起来不对"。
- **光学对齐**：icon 侧 padding = 文字侧 − 2px；播放三角形右偏 2px；不对称图标优先修 SVG。
- **Shadow 替代 Border**：卡片/容器深度用多层透明 `box-shadow` + CSS 变量（light/dark），分隔线仍用 border。
- **图片 Outline**：1px 低透明度 `outline`（非 border），不影响布局。

## 检查清单

- [ ] 主次信息层级明显，标签不会和内容抢权重。
- [ ] 间距使用固定尺度，没有随手写的零散值。
- [ ] 正文宽度、表单宽度、卡片宽度都受约束。
- [ ] 文本颜色和背景颜色满足可读性，不靠纯黑和纯灰硬顶。
- [ ] 嵌套圆角遵循同心公式 `outer = inner + padding`。
- [ ] 按钮图标侧 padding 做了光学补偿。
- [ ] 卡片/容器深度用 shadow 而非 border。
- [ ] 图片有低透明度 outline。

## 反模式

### FAIL: 每个按钮都是主按钮

```tsx
<Button variant="primary">保存</Button>
<Button variant="primary">取消</Button>
<Button variant="primary">删除</Button>
// 用户不知道该点哪个
```

### PASS: 明确主次层级

```tsx
<Button variant="primary">保存</Button>        {/* 主操作 */}
<Button variant="ghost">取消</Button>           {/* 次操作 */}
<Button variant="destructive">删除</Button>     {/* 危险独立 */}
```

### FAIL: 随机间距值

```tsx
<div style={{ padding: "13px", marginBottom: "22px", gap: "7px" }}>
```

### PASS: 固定 spacing 尺度

```tsx
<div className="p-4 mb-6 gap-2">  {/* 4/8/16/24/32px */}
```

### FAIL: 只靠颜色区分层级

```tsx
<span className="text-red-500">错误</span>  {/* 色盲用户看不出 */}
```

### PASS: 颜色 + 图标 + 权重

```tsx
<span className="text-red-500 font-medium">
  <AlertCircle className="inline w-4 h-4 mr-1" />错误
</span>
```

## 参考资料

- [design-system-patterns](../design-system-patterns/SKILL.md)
- [frontend-design-review](../frontend-design-review/SKILL.md)
- [responsive-design](../responsive-design/SKILL.md)
- [references/advanced-patterns.md](references/advanced-patterns.md)
- [references/accessibility-depth.md](references/accessibility-depth.md)
- [references/animation-microinteractions.md](references/animation-microinteractions.md)
- [references/data-visualization.md](references/data-visualization.md)
- [references/theming-dark-mode.md](references/theming-dark-mode.md)
- [references/surface-polish.md](references/surface-polish.md)
