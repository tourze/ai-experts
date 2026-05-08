# Visual Design Foundations

## 适用场景

- 需要为新项目建立字体、颜色、间距、圆角、阴影等基础 token。
- 现有界面“哪里都不算错，但整体很乱”，需要统一视觉层级。
- 需要把设计语言转换成前端可实现的 token 或样式约束。
- 需要检查对比度、字号、间距、触控区是否满足基础可访问性。
- 如果问题本质是任务流、命名、反馈缺失，优先回到 [ux-heuristics](../../ux-heuristics/SKILL.md)；如果需要研究证据支持视觉改版，联动 [ux-researcher-designer](../../ux-researcher-designer/SKILL.md)。
- 详细参考优先查看 [color-systems](./color-systems.md)、[typography-systems](./typography-systems.md)、[spacing-iconography](./spacing-iconography.md)。

## 核心约束

- token 命名按语义，不按表象；优先 `primary`, `surface`, `danger`，不要 `blue-500-button`。
- 字体家族控制在 1 到 2 套，字重控制在 2 到 3 档。
- 间距必须使用离散尺度，禁止随手写 magic number。
- 颜色不仅看品牌感，还要满足文本、组件、边界的可读性要求。
- 图标只表达补充信息，关键操作不能只靠图标猜。
- 设计规范要能被实现；不给“氛围感建议”，只给可落地约束。

## 代码模式

设计 token 可以先用 JSON 表达，再映射到 CSS、Tailwind 或设计系统：

```json
{
  "color": {
    "primary": "#2563eb",
    "surface": "#ffffff",
    "text-primary": "#111827",
    "text-secondary": "#4b5563",
    "danger": "#dc2626"
  },
  "spacing": {
    "2": "0.5rem",
    "4": "1rem",
    "6": "1.5rem",
    "8": "2rem"
  },
  "radius": {
    "sm": "0.375rem",
    "md": "0.75rem"
  }
}
```

若需要直接给前端实现，可输出最小可执行 token 模块：

```js
export const designTokens = {
  typography: {
    body: { fontSize: "1rem", lineHeight: 1.6 },
    heading: { fontSize: "2rem", lineHeight: 1.2 }
  },
  icon: {
    sm: 16,
    md: 20,
    lg: 24
  }
};
```

视觉基线落地前，至少确认以下约束已存在于规范或代码：

```bash
rg -n "color|spacing|font|radius|shadow|icon" src styles tokens tailwind.config.* theme.*
```

## 检查清单

- [ ] 颜色、间距、字号、圆角都已有统一 token，而不是局部硬编码。
- [ ] 正文文本对比度满足可读性底线，重要按钮状态齐全。
- [ ] 视觉层级依靠字号、粗细、留白和颜色共同建立，而不是只靠颜色。
- [ ] 图标尺寸和描边风格一致，且有文字或可访问名称配套。
- [ ] 组件状态包含 hover、focus、disabled、error。
- [ ] 移动端触控区、换行、密度和留白已经单独校正。
- [ ] 输出规范已经能直接交给前端或设计系统，不需要二次翻译。

## 反模式

### FAIL: 无离散尺度

```css
.card { padding: 13px; margin: 17px; font-size: 15px; }
.list { padding: 11px; margin: 19px; font-size: 13px; }
/* 没人记得尺度 / 每页都重新发明 */
```

### PASS: 尺度 token

```css
:root {
  --space-1: 4px; --space-2: 8px; --space-3: 12px;
  --space-4: 16px; --space-6: 24px; --space-8: 32px;
}
.card { padding: var(--space-4); }
```

### FAIL: 品牌色堆满

```css
button, .tag, .alert, .label { background: var(--brand); }
/* 所有元素都是主色 → 没有视觉层级 → 用户不知道该点哪个 */
```

### PASS: 主次分明

```
primary CTA (60% 背景或强品牌色)
secondary (outline / ghost)
tag / label (neutral / semantic color，不抢主色)
```