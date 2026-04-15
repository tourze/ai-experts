# Platform.select 用于值差异

## 正确用法：纯值映射

```typescript
// src/theme/shadows.ts
import { Platform } from 'react-native';

export const cardShadow = Platform.select({
  ios: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  android: {
    elevation: 4,
  },
  default: {
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
});

export const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
});

export const hitSlop = Platform.select({
  ios: { top: 8, bottom: 8, left: 8, right: 8 },
  android: { top: 12, bottom: 12, left: 12, right: 12 },
  default: undefined,
});
```

## 边界：值选择 vs 控制流

| 场景 | 正确方式 | 错误方式 |
|---|---|---|
| 阴影 / 字体 / 间距 | `Platform.select({ ios: ..., android: ... })` | - |
| 不同组件实现 | 边界文件 `.ios.ts` / `.android.ts` | `Platform.select` 返回组件 |
| 不同 API 调用 | 适配器接口 + 平台实现 | `if (Platform.OS)` 混入业务逻辑 |
| 不同导航结构 | 平台文件分叉 | `Platform.select` 中写 JSX |

## 关键点

- `Platform.select` 的 `default` 覆盖所有未显式列出的平台（Web、macOS、Windows 等）。
- 返回值必须是纯数据，不包含副作用、组件或函数调用。
- 多处使用相同值映射时，抽成主题常量，不要重复写 `Platform.select`。
