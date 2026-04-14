---
name: design-system-patterns
description: 用于搭建设计令牌、主题系统和组件架构。当用户提到“设计系统”“design tokens”“主题切换”“组件库规范”“多品牌主题”时使用。
---

# 设计系统模式

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
- 与 [tailwind-design-system](../tailwind-design-system/SKILL.md) 联动时，优先复用同一套 token 名称。

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

- 在组件里直接写 `#3b82f6`、`12px`、`box-shadow` 常量。
- 把 `primary-500`、`danger-500` 同时当作品牌语义和业务语义。
- 每个组件自己决定暗色模式逻辑，导致主题漂移。
- 通过增加 `variant2`、`variant3` 逃避 API 设计。
- 为单个页面临时加 token，最后令牌表膨胀失控。

## 参考资料

- [tailwind-design-system](../tailwind-design-system/SKILL.md)
- [refactoring-ui](../refactoring-ui/SKILL.md)
- [responsive-design](../responsive-design/SKILL.md)
- [references/design-tokens.md](references/design-tokens.md)
- [references/theming-architecture.md](references/theming-architecture.md)
- [references/component-architecture.md](references/component-architecture.md)
