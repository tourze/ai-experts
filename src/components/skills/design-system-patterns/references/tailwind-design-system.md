# Tailwind 设计系统集成

与 `design-system-patterns` 联动时，将设计令牌映射到 Tailwind CSS v4 配置。

## Token 映射约定

- 设计令牌命名与 Tailwind 主题 key 保持一致。
- `color.primary` → `theme.colors.primary`。
- `spacing.*` → `theme.spacing.*`。
- `fontSize.*` → `theme.fontSize.*`。

## 配置示例

```js
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: { /* 50-950 scale */ },
        neutral: { /* 50-950 scale */ },
      },
    },
  },
};
```

## 约束

- 优先使用 Tailwind 内置 token，只扩展必要的设计令牌。
- 不创建与 Tailwind 内置 key 同名的自定义 token。
- CSS 变量（`--color-*`）与 Tailwind 主题保持双向同步。
