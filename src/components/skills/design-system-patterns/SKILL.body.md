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
- [references/design-tokens.md](references/design-tokens.md)
- [references/theming-architecture.md](references/theming-architecture.md)
- [references/component-architecture.md](references/component-architecture.md)
- [references/master-overrides-pattern.md](references/master-overrides-pattern.md)
