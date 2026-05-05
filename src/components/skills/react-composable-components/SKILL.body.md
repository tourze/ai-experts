## 核心约束

- 一个组件只做一件事；结构组合优先于“超级配置对象”。
- 复用型 UI 组件默认接受 `className`、`children`、`...props`，像原生元素一样透明。
- 包装原生 DOM 元素时，默认补上 `forwardRef`，避免把焦点、测量、滚动能力截断。
- 共享状态只在局部 compound components 内部用 Context；不要把业务级全局状态塞进组件库内部。
- 样式覆盖必须可预期；Tailwind 场景下合并类名时要做去重。
- 避免为了“复用”提炼出过浅抽象；抽象失败时宁可保留两处小重复。

## 代码模式

```tsx
import {
  createContext,
  forwardRef,
  useContext,
  useMemo,
  useState,
  type ButtonHTMLAttributes,
  type PropsWithChildren,
} from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

type CardContextValue = {
  dense: boolean;
};

const CardContext = createContext<CardContextValue | null>(null);

type CardProps = PropsWithChildren<{
  dense?: boolean;
  className?: string;
}>;

export function Card({ dense = false, className, children }: CardProps) {
  const value = useMemo(() => ({ dense }), [dense]);
  return (
    <CardContext.Provider value={value}>
      <section className={cn("rounded-xl border bg-white shadow-sm", className)}>
        {children}
      </section>
    </CardContext.Provider>
  );
}

export function CardHeader({ className, children }: PropsWithChildren<{ className?: string }>) {
  const ctx = useContext(CardContext);
  return <header className={cn(ctx?.dense ? "p-4" : "p-6", className)}>{children}</header>;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export const CardAction = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        "rounded-md px-3 py-2 text-sm transition-colors",
        variant === "primary"
          ? "bg-slate-900 text-white"
          : "bg-slate-100 text-slate-900",
        className,
      )}
      {...props}
    />
  ),
);

CardAction.displayName = "CardAction";
```

```tsx
import { useState } from "react";

export function Example() {
  const [open, setOpen] = useState(false);

  return (
    <Card dense={open}>
      <CardHeader className="flex items-center justify-between">
        <h2 className="font-semibold">Project</h2>
        <CardAction onClick={() => setOpen((value) => !value)}>
          {open ? "收起" : "展开"}
        </CardAction>
      </CardHeader>
    </Card>
  );
}
```

## 检查清单

- [ ] 是否把大组件拆成了可独立测试、可复用的结构片段？
- [ ] 可复用组件是否支持 `children`、`className` 与原生属性透传？
- [ ] 包装原生元素时是否保留了 `ref`？
- [ ] 样式合并是否会让调用方可靠覆盖默认样式？
- [ ] 需要共享状态时，是否把 Context 作用域控制在局部复合组件内？
- [ ] 是否优先通过组合表达结构，而不是继续叠加布尔 props？

## 反模式

- 用配置型 props（`hasHeader`、`headerActions`）替代 `children` 插槽 — 无法表达任意嵌套结构。
- 不透传原生属性 — 调用方丢失 `aria-label`、`disabled`、`type` 等能力。

反模式 FAIL/PASS 对比的完整代码见 [references/advanced-patterns.md](references/advanced-patterns.md)。
