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

## 按压反馈与图标动画

详见 [references/press-and-icon-patterns.md](references/press-and-icon-patterns.md)：

- **Scale on press**：`scale(0.96)`，不低于 0.95。用 CSS transition 保证可中断。提供 `static` prop 禁用。
- **图标交叉渐变**：有 Motion 用 `AnimatePresence`；无 Motion 保留双 icon 在 DOM，用 CSS transition 交叉渐变（`cubic-bezier(0.2, 0, 0, 1)`）。
- **入场 split+stagger**：拆成语义块，~100ms 间隔，组合 opacity + blur + translateY。
- **退场柔和**：小固定 `translateY(-12px)` 而非全高度，150ms，比入场短。
