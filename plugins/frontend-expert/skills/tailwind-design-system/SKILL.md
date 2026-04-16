---
name: tailwind-design-system
description: 当需要用 Tailwind CSS v4 构建设计系统、定义 token、组件变体或主题时使用。当用户提到 Tailwind 设计系统、CSS-first 配置或组件库规范时触发。
---

# Tailwind 设计系统

## 适用场景

- 需要用 Tailwind 搭建设计系统和组件库。
- 需要把颜色、字号、圆角、阴影和动画沉淀为统一 token。
- 需要在 Tailwind v4 的 CSS-first 模式下组织主题和变体。
- 需要治理项目里大量任意值和一次性 utility 堆叠。

## 核心约束

- 默认按 Tailwind v4 处理：主题定义优先放在 CSS 的 `@theme` 中。
- token 先于组件，组件先于页面；不要直接在页面里发明新的视觉语言。
- utility class 可以很多，但语义不能乱；变体命名要稳定可复用。
- 任意值只用于过渡阶段，不要长期变成“第二套设计系统”。
- 与 [design-system-patterns](../design-system-patterns/SKILL.md) 共用一套 token 命名。

## 代码模式

```css
@import "tailwindcss";

@theme {
  --color-surface: #ffffff;
  --color-text: #111827;
  --color-brand: #2563eb;
  --radius-md: 0.5rem;
  --shadow-card: 0 10px 20px rgba(17, 24, 39, 0.08);
}
```

```ts
import { cva } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium transition-colors",
  {
    variants: {
      variant: {
        primary: "bg-brand text-white",
        subtle: "bg-transparent text-foreground",
      },
      size: {
        md: "h-10 px-4",
        lg: "h-12 px-6",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  },
);
```

## 检查清单

- [ ] `@theme` 或等价机制中已定义核心 token。
- [ ] 组件变体通过 `cva` / 统一模式管理，而非散落页面。
- [ ] 常用 utility 已沉淀为组件或抽象，不再重复拷贝。
- [ ] 任意值使用频率可控，且有回收计划。
- [ ] 暗色模式、焦点态、禁用态和响应式都已覆盖。

## 反模式

### FAIL: 任意值横飞

```tsx
<div className="px-[13px] py-[7px] text-[15px] gap-[11px]">
// 永远偏离 4/8 网格 → 视觉密度不一致 → 无法形成节奏
```

### PASS: 走 token

```tsx
<div className="px-3 py-2 text-sm gap-2">
// 命中 spacing scale → 与系统其他组件天然对齐
```

### FAIL: 看到差异就加 token

```css
@theme {
  --color-blue-510: #3a82f5;  /* 设计稿临时色 */
  --color-blue-520: #3982f4;  /* 另一页临时色 */
}
/* token 表膨胀，没人敢删 */
```

### PASS: 先复用再扩展

```
新 token 准入：
1. 至少 3 处使用
2. 现有 token 都不能表达
3. 命名进入语义层（--color-info），不是数字
```

### FAIL: utility 堆代替组件

```tsx
{users.map(u => <div className="flex items-center gap-3 p-4 rounded-lg border bg-surface hover:bg-muted">...</div>)}
// 5 个页面各写一遍，改样式要改 5 处
```

### PASS: cva 抽组件

```tsx
const userCard = cva("flex items-center gap-3 p-4 rounded-lg border");
<div className={userCard({ state: 'idle' })}>
```

## 参考资料

- [design-system-patterns](../design-system-patterns/SKILL.md)
- [responsive-design](../responsive-design/SKILL.md)
- [refactoring-ui](../refactoring-ui/SKILL.md)
- [references/advanced-patterns.md](references/advanced-patterns.md)
- [Tailwind v4 升级指南](https://tailwindcss.com/docs/upgrade-guide)
