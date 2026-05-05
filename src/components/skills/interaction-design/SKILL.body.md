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

## 按压反馈与图标动画

详见 [references/press-and-icon-patterns.md](references/press-and-icon-patterns.md)：

- **Scale on press**：`scale(0.96)`，不低于 0.95。用 CSS transition 保证可中断。提供 `static` prop 禁用。
- **图标交叉渐变**：有 Motion 用 `AnimatePresence`；无 Motion 保留双 icon 在 DOM，用 CSS transition 交叉渐变（`cubic-bezier(0.2, 0, 0, 1)`）。
- **入场 split+stagger**：拆成语义块，~100ms 间隔，组合 opacity + blur + translateY。
- **退场柔和**：小固定 `translateY(-12px)` 而非全高度，150ms，比入场短。

## 检查清单

- [ ] 每个动效都能解释”它在告诉用户什么”。
- [ ] hover、focus、active、disabled、loading 状态都完整。
- [ ] 已验证低性能设备和降级动效偏好。
- [ ] 过渡不会阻塞主要操作或影响可读性。
- [ ] 动效速度、位移和透明度变化有一致的系统感。
- [ ] 按钮按压用 `scale(0.96)`，不低于 0.95。
- [ ] 图标动画用 opacity+scale+blur，不直接 toggle visibility。

## 反模式

### FAIL: 按钮无即时反馈

```tsx
<button onClick={submit}>提交</button>
// 用户点完没变化，继续狂点
```

### PASS: 反馈 + 锁定

```tsx
<button onClick={submit} disabled={pending} className=”transition active:scale-95”>
  {pending ? <Spinner /> : “提交”}
</button>
```

### FAIL: 到处都在动

```tsx
{items.map(i =>
  <motion.li animate={{ y: 0, opacity: 1 }} initial={{ y: 20, opacity: 0 }}>
    {i.title}
  </motion.li>
)}
// 100 个列表项同时淡入 → 主线程卡 200ms
```

### PASS: 动效克制

```tsx
// 列表项不动，只给新加入的行 enter 动画
{items.map(i => <li key={i.id}>{i.title}</li>)}
```

- 动效只为”显得高级”，却不传递任何状态。
- 用 motion 掩盖信息架构问题。

## 参考资料

- [lottie-animations](references/lottie-animations.md)
- [modern-web-design](../modern-web-design/SKILL.md)
- [references/microinteraction-patterns.md](references/microinteraction-patterns.md)
- [references/press-and-icon-patterns.md](references/press-and-icon-patterns.md)
- [references/scroll-animations.md](references/scroll-animations.md)
- [references/animation-libraries.md](references/animation-libraries.md)
