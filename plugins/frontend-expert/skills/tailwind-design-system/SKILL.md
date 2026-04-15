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

- 看到一个视觉差异就加一个新 token。
- 页面里到处出现 `px-[13px]`、`text-[17px]` 之类任意值。
- 变体命名完全跟着某个页面走，无法跨场景复用。
- 用过多 utility 堆出复杂结构，却没有任何组件抽象。
- Tailwind v4 项目仍依赖过时的 v3 心智模型。

## 参考资料

- [design-system-patterns](../design-system-patterns/SKILL.md)
- [responsive-design](../responsive-design/SKILL.md)
- [refactoring-ui](../refactoring-ui/SKILL.md)
- [references/advanced-patterns.md](references/advanced-patterns.md)
- [Tailwind v4 升级指南](https://tailwindcss.com/docs/upgrade-guide)
