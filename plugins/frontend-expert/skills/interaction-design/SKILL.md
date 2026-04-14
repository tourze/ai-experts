---
name: interaction-design
description: 用于设计微交互、动效、过渡和反馈状态。当用户提到“加点交互感”“做 loading/skeleton”“优化 hover/focus/transition”“让界面更顺滑”时使用。
---

# 交互设计

## 适用场景

- 为按钮、卡片、表单、导航和反馈提示增加微交互。
- 设计页面切换、弹层展开、列表刷新等状态过渡。
- 为加载、提交、空态、成功态和失败态设计反馈。
- 需要把交互与性能、无障碍和品牌风格同时兼顾。

## 核心约束

- 动效必须服务信息传达：反馈、导向、层级和连续性，不做纯装饰噪音。
- 默认优先 CSS 或轻量动画能力；只有需要复杂编排时再引入更重的库。
- 所有动效都要兼容 `prefers-reduced-motion`。
- 微交互时长控制在感知区间：100-150ms 反馈、200-300ms 轻过渡、300-500ms 中型切换。
- 一个页面只需要少量高质量动效，不要处处都在动。

## 代码模式

```tsx
import { motion } from "framer-motion";

export function ActionButton(props) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 24 }}
      {...props}
    />
  );
}
```

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

```tsx
function CardSkeleton() {
  return <div className="animate-pulse rounded-xl bg-muted h-32" />;
}
```

## 检查清单

- [ ] 每个动效都能解释“它在告诉用户什么”。
- [ ] hover、focus、active、disabled、loading 状态都完整。
- [ ] 已验证低性能设备和降级动效偏好。
- [ ] 过渡不会阻塞主要操作或影响可读性。
- [ ] 动效速度、位移和透明度变化有一致的系统感。

## 反模式

- 动效只为“显得高级”，却不传递任何状态。
- 在列表、表格、表单里同时堆叠大量淡入、缩放、弹跳。
- 用 motion 掩盖信息架构问题。
- 忽略 `prefers-reduced-motion`。
- 按钮点击后没有即时反馈，只让用户猜有没有触发。

## 参考资料

- [lottie-animations](../lottie-animations/SKILL.md)
- [modern-web-design](../modern-web-design/SKILL.md)
- [references/microinteraction-patterns.md](references/microinteraction-patterns.md)
- [references/scroll-animations.md](references/scroll-animations.md)
- [references/animation-libraries.md](references/animation-libraries.md)
