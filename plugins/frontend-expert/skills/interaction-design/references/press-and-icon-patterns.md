# Press & Icon Patterns — 按压反馈与图标动画

## Scale on Press

按钮点击用 `scale(0.96)` 提供触觉反馈。不低于 0.95——更小会显夸张。用 CSS transition 保证可中断。

```css
.button {
  transition-property: scale;
  transition-duration: 150ms;
  transition-timing-function: ease-out;
}
.button:active { scale: 0.96; }
```

```tsx
// Tailwind
<button className="transition-transform duration-150 ease-out active:scale-[0.96]">
  Click me
</button>

// Motion
<motion.button whileTap={{ scale: 0.96 }}>Click me</motion.button>
```

### Static Prop 模式

不是每个按钮都需要。提供 `static` prop 关闭：

```tsx
const tapScale = "active:not-disabled:scale-[0.96]";

function Button({ static: isStatic, className, children, ...props }) {
  return (
    <button
      className={cn(
        "transition-transform duration-150 ease-out",
        !isStatic && tapScale,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

<Button>Click me</Button>        // scales
<Button static>Submit</Button>   // no scale
```

## 图标交叉渐变

图标出现/消失（hover、状态切换）用 opacity + scale + blur 过渡，不直接 toggle visibility。

**固定参数**（不要偏离）：
- scale: `0.25` → `1`
- opacity: `0` → `1`
- filter: `blur(4px)` → `blur(0px)`
- Motion transition: `{ type: "spring", duration: 0.3, bounce: 0 }`（bounce 必须为 0）

### Motion 方案

```tsx
import { AnimatePresence, motion } from "motion/react";

function IconButton({ isActive, icon: Icon }) {
  return (
    <button>
      <AnimatePresence mode="popLayout">
        <motion.span
          key={isActive ? "active" : "inactive"}
          initial={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          exit={{ opacity: 0, scale: 0.25, filter: "blur(4px)" }}
          transition={{ type: "spring", duration: 0.3, bounce: 0 }}
        >
          <Icon />
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
```

### CSS-only 方案（无 Motion 依赖）

双 icon 保留在 DOM，一个 absolute 叠加，切换状态交叉渐变：

```tsx
function IconButton({ isActive, ActiveIcon, InactiveIcon }) {
  return (
    <button>
      <div className="relative">
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center",
            "transition-[opacity,filter,scale] duration-300",
            "[transition-timing-function:cubic-bezier(0.2,0,0,1)]",
            isActive
              ? "scale-100 opacity-100 blur-0"
              : "scale-[0.25] opacity-0 blur-[4px]"
          )}
        >
          <ActiveIcon />
        </div>
        <div
          className={cn(
            "transition-[opacity,filter,scale] duration-300",
            "[transition-timing-function:cubic-bezier(0.2,0,0,1)]",
            isActive
              ? "scale-[0.25] opacity-0 blur-[4px]"
              : "scale-100 opacity-100 blur-0"
          )}
        >
          <InactiveIcon />
        </div>
      </div>
    </button>
  );
}
```

非 absolute 的 icon 定义布局尺寸，absolute icon 叠加不影响 flow。

### 选择策略

| | Motion | CSS-only |
|--|--------|----------|
| 入场动画 | Yes | Yes |
| 退场动画 | Yes（AnimatePresence） | Yes（交叉渐变） |
| Spring 物理 | Yes | 用 `cubic-bezier(0.2, 0, 0, 1)` 近似 |
| 何时用 | 项目已有 `motion/react` | 无 motion 依赖或控制 bundle |

**规则**：查 `package.json` 有 `motion` 或 `framer-motion` 就用 Motion 方案，否则用 CSS 方案——不要为图标过渡引入新依赖。

## 入场：Split + Stagger

不要动画单个大容器。拆成语义块，各自动画。

1. 拆成逻辑分组（标题、描述、按钮）
2. ~100ms 间隔交错
3. 标题可按词拆，~80ms 间隔
4. 组合 `opacity` + `blur(4px)` + `translateY(12px)`

```tsx
// Motion stagger
<motion.div initial="hidden" animate="visible"
  variants={{ visible: { transition: { staggerChildren: 0.1 } } }}>
  <motion.h1 variants={{
    hidden: { opacity: 0, y: 12, filter: "blur(4px)" },
    visible: { opacity: 1, y: 0, filter: "blur(0px)" },
  }}>Welcome</motion.h1>
  <motion.p variants={/* 同上 */}>Description</motion.p>
</motion.div>
```

```css
/* CSS-only stagger */
.stagger-item {
  opacity: 0; transform: translateY(12px); filter: blur(4px);
  animation: fadeInUp 400ms ease-out forwards;
}
.stagger-item:nth-child(1) { animation-delay: 0ms; }
.stagger-item:nth-child(2) { animation-delay: 100ms; }
.stagger-item:nth-child(3) { animation-delay: 200ms; }

@keyframes fadeInUp {
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}
```

## 退场：柔和优先

退场应比入场柔和——用户注意力已移向下一步。

- 小固定 `translateY(-12px)`，不用全高度
- 150ms，比入场短（入场 300ms）
- 保留方向感，不要直接 `display: none`

```css
/* Good — 柔和退场 */
.item-exit {
  opacity: 0;
  transform: translateY(-12px);
  transition: opacity 150ms ease-in, transform 150ms ease-in;
}

/* Bad — 戏剧性退场 */
.item-exit {
  opacity: 0;
  transform: translateY(-100%) scale(0.5);
  transition: all 400ms ease-in;
}
```
