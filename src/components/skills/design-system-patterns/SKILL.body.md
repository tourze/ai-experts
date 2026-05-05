## 适用场景

- 从零开始建立设计令牌、颜色体系、字号体系和组件 API。
- 需要支持浅色/深色、多品牌或多租户主题。
- 希望把 Figma、代码和组件库约束成同一套命名体系。
- 需要审查项目里大量硬编码颜色、间距和阴影值。

## 核心约束

- 令牌必须分层：原始值、语义值、组件值，不要把品牌色直接写进组件。
- 主题切换必须以 CSS 变量或等价机制为中心，避免每个组件各自判断主题。
- 组件 API 先稳定，再追求“无限灵活”；变体命名要服务业务语义。
- 设计系统是约束系统，不是素材堆。新增 token 前先确认是否已有语义位。
- 与 [tailwind-design-system](references/tailwind-design-system.md) 联动时，优先复用同一套 token 名称。

## 代码模式

```css
:root {
  --color-brand-500: #2563eb;
  --color-surface: #ffffff;
  --color-text-primary: #111827;
  --space-2: 0.5rem;
  --space-4: 1rem;
}

[data-theme="dark"] {
  --color-surface: #111827;
  --color-text-primary: #f9fafb;
}
```

```ts
export const buttonTokens = {
  primary: {
    background: "var(--color-brand-500)",
    color: "var(--color-surface)",
  },
  subtle: {
    background: "transparent",
    color: "var(--color-text-primary)",
  },
};
```

```tsx
type ButtonProps = {
  variant?: "primary" | "subtle";
  size?: "sm" | "md" | "lg";
};
```

## 检查清单

- [ ] 颜色、字号、间距、圆角、阴影都已有明确 token。
- [ ] token 命名同时覆盖设计语言和业务语义。
- [ ] 主题切换不会要求组件内重复维护深浅色逻辑。
- [ ] 组件变体与设计稿状态一一对应。
- [ ] 文档里给出了“何时新增 token、何时复用 token”的判断标准。
- [ ] 至少有一个真实业务页面验证过 token 的可复用性。

## 反模式

### FAIL: 组件里写硬编码值

```tsx
<button style={{ background: '#3b82f6', padding: '12px 16px' }}>
// 改主题需要全局搜索替换 → 漏改 → 视觉漂移
```

### PASS: 组件只引 token

```tsx
<button className="bg-brand-primary px-4 py-3">
// 改 --color-brand-primary → 全局自动跟随
```

### FAIL: 一层 token 当所有用途

```css
--color-primary-500: #3b82f6;  /* 既是品牌色也是按钮色也是链接色 */
/* 想换按钮颜色但保留品牌色 → 无法解耦 */
```

### PASS: 三层 token

```css
/* 原始层 */ --blue-500: #3b82f6;
/* 语义层 */ --color-brand: var(--blue-500);
/* 组件层 */ --button-primary-bg: var(--color-brand);
/* 任何一层都可独立替换 */
```

### FAIL: 组件内部判断主题

```tsx
const bg = isDark ? '#1f2937' : '#ffffff';
// 50 个组件 50 套判断 → 新主题要改 50 处
```

### PASS: CSS 变量统一切换

```css
[data-theme='dark'] { --color-surface: #1f2937; }
/* 组件只用 var(--color-surface)，主题切换零侵入 */
```

## 跨会话持久化：BRAND + MASTER + Overrides

在 AI 协作场景下，把设计系统落到仓库里的 Markdown 比留在聊天记录里更可靠。推荐三层结构：

```
design-system/
├── BRAND.md           # 品牌层：受众、语气、反参考（变化慢）
├── MASTER.md          # 系统层：全局 token、字体、反模式（变化中）
└── pages/
    └── <name>.md      # 页面层：相对 MASTER 的**覆盖项**（变化快）
```

AI 实现/审查具体页面时，按 **BRAND → MASTER → pages/\<slug\>.md** 顺序拼上下文；pages 存在则覆盖 MASTER 同字段，任何决定都不能违反 BRAND 的反参考。详见 [references/master-overrides-pattern.md](references/master-overrides-pattern.md)。

## 参考资料

- [tailwind-design-system](references/tailwind-design-system.md)
- [refactoring-ui](../modern-web-design/SKILL.md)
- [responsive-design](../responsive-design/SKILL.md)
- [references/design-tokens.md](references/design-tokens.md)
- [references/theming-architecture.md](references/theming-architecture.md)
- [references/component-architecture.md](references/component-architecture.md)
- [references/master-overrides-pattern.md](references/master-overrides-pattern.md)
