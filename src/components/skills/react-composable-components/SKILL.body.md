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
