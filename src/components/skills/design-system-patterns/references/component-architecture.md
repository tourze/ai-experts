# 组件架构模式

## 概述

架构良好的组件是可复用、可组合且可维护的。本指南涵盖构建可跨设计系统扩展的灵活组件 API 的模式。

## 复合组件

复合组件通过 React context 共享隐式状态，允许灵活组合。

```tsx
// 复合组件模式
import * as React from "react";

interface AccordionContextValue {
  openItems: Set<string>;
  toggle: (id: string) => void;
  type: "single" | "multiple";
}

const AccordionContext = React.createContext<AccordionContextValue | null>(
  null,
);

function useAccordionContext() {
  const context = React.useContext(AccordionContext);
  if (!context) {
    throw new Error("Accordion components must be used within an Accordion");
  }
  return context;
}

// 根组件
interface AccordionProps {
  children: React.ReactNode;
  type?: "single" | "multiple";
  defaultOpen?: string[];
}

function Accordion({
  children,
  type = "single",
  defaultOpen = [],
}: AccordionProps) {
  const [openItems, setOpenItems] = React.useState<Set<string>>(
    new Set(defaultOpen),
  );

  const toggle = React.useCallback(
    (id: string) => {
      setOpenItems((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          if (type === "single") {
            next.clear();
          }
          next.add(id);
        }
        return next;
      });
    },
    [type],
  );

  return (
    <AccordionContext.Provider value={{ openItems, toggle, type }}>
      <div className="divide-y divide-border">{children}</div>
    </AccordionContext.Provider>
  );
}

// 项目组件
interface AccordionItemProps {
  children: React.ReactNode;
  id: string;
}

function AccordionItem({ children, id }: AccordionItemProps) {
  return (
    <AccordionItemContext.Provider value={{ id }}>
      <div className="py-2">{children}</div>
    </AccordionItemContext.Provider>
  );
}

// 触发器组件
function AccordionTrigger({ children }: { children: React.ReactNode }) {
  const { toggle, openItems } = useAccordionContext();
  const { id } = useAccordionItemContext();
  const isOpen = openItems.has(id);

  return (
    <button
      onClick={() => toggle(id)}
      className="flex w-full items-center justify-between py-2 font-medium"
      aria-expanded={isOpen}
    >
      {children}
      <ChevronDown
        className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
      />
    </button>
  );
}

// 内容组件
function AccordionContent({ children }: { children: React.ReactNode }) {
  const { openItems } = useAccordionContext();
  const { id } = useAccordionItemContext();
  const isOpen = openItems.has(id);

  if (!isOpen) return null;

  return <div className="pb-4 text-muted-foreground">{children}</div>;
}

// 导出复合组件
export const AccordionCompound = Object.assign(Accordion, {
  Item: AccordionItem,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
});

// 使用示例
function Example() {
  return (
    <AccordionCompound type="single" defaultOpen={["item-1"]}>
      <AccordionCompound.Item id="item-1">
        <AccordionCompound.Trigger>它无障碍吗？</AccordionCompound.Trigger>
        <AccordionCompound.Content>
          是的。它遵循 WAI-ARIA 模式。
        </AccordionCompound.Content>
      </AccordionCompound.Item>
      <AccordionCompound.Item id="item-2">
        <AccordionCompound.Trigger>它有样式吗？</AccordionCompound.Trigger>
        <AccordionCompound.Content>
          是的。它使用 Tailwind CSS。
        </AccordionCompound.Content>
      </AccordionCompound.Item>
    </AccordionCompound>
  );
}
```

## 多态组件

多态组件可以渲染为不同的 HTML 元素或其他组件。

```tsx
// 具有正确 TypeScript 支持的多态组件
import * as React from "react";

type AsProp<C extends React.ElementType> = {
  as?: C;
};

type PropsToOmit<C extends React.ElementType, P> = keyof (AsProp<C> & P);

type PolymorphicComponentProp<
  C extends React.ElementType,
  Props = {},
> = React.PropsWithChildren<Props & AsProp<C>> &
  Omit<React.ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

type PolymorphicRef<C extends React.ElementType> =
  React.ComponentPropsWithRef<C>["ref"];

type PolymorphicComponentPropWithRef<
  C extends React.ElementType,
  Props = {},
> = PolymorphicComponentProp<C, Props> & { ref?: PolymorphicRef<C> };

// Button 组件
interface ButtonOwnProps {
  variant?: "default" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

type ButtonProps<C extends React.ElementType = "button"> =
  PolymorphicComponentPropWithRef<C, ButtonOwnProps>;

const Button = React.forwardRef(
  <C extends React.ElementType = "button">(
    {
      as,
      variant = "default",
      size = "md",
      className,
      children,
      ...props
    }: ButtonProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const Component = as || "button";

    const variantClasses = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      outline: "border border-input bg-background hover:bg-accent",
      ghost: "hover:bg-accent hover:text-accent-foreground",
    };

    const sizeClasses = {
      sm: "h-8 px-3 text-sm",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };

    return (
      <Component
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors",
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {children}
      </Component>
    );
  },
);

Button.displayName = "Button";

// 使用示例
function Example() {
  return (
    <>
      {/* 作为 button（默认） */}
      <Button variant="default" onClick={() => {}}>
        点击我
      </Button>

      {/* 作为 anchor 链接 */}
      <Button as="a" href="/page" variant="outline">
        前往页面
      </Button>

      {/* 作为 Next.js Link */}
      <Button as={Link} href="/dashboard" variant="ghost">
        仪表盘
      </Button>
    </>
  );
}
```

## Slot 模式

Slot 允许用户将默认元素替换为自定义实现。

```tsx
// 可自定义组件的 Slot 模式
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: "default" | "outline";
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ asChild = false, variant = "default", className, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium",
          variant === "default" && "bg-primary text-primary-foreground",
          variant === "outline" && "border border-input bg-background",
          className,
        )}
        {...props}
      />
    );
  },
);

// 使用示例 - Button 样式应用于子元素
function Example() {
  return (
    <Button asChild variant="outline">
      <a href="/link">我是看起来像按钮的链接</a>
    </Button>
  );
}
```

## Headless 组件

Headless 组件提供行为而不包含样式，实现完全的视觉自定义。

```tsx
// Headless toggle hook
import * as React from "react";

interface UseToggleProps {
  defaultPressed?: boolean;
  pressed?: boolean;
  onPressedChange?: (pressed: boolean) => void;
}

function useToggle({
  defaultPressed = false,
  pressed: controlledPressed,
  onPressedChange,
}: UseToggleProps = {}) {
  const [uncontrolledPressed, setUncontrolledPressed] =
    React.useState(defaultPressed);

  const isControlled = controlledPressed !== undefined;
  const pressed = isControlled ? controlledPressed : uncontrolledPressed;

  const toggle = React.useCallback(() => {
    if (!isControlled) {
      setUncontrolledPressed((prev) => !prev);
    }
    onPressedChange?.(!pressed);
  }, [isControlled, pressed, onPressedChange]);

  return {
    pressed,
    toggle,
    buttonProps: {
      role: "switch" as const,
      "aria-checked": pressed,
      onClick: toggle,
    },
  };
}

// Headless listbox hook
interface UseListboxProps<T> {
  items: T[];
  defaultSelectedIndex?: number;
  onSelect?: (item: T, index: number) => void;
}

function useListbox<T>({
  items,
  defaultSelectedIndex = -1,
  onSelect,
}: UseListboxProps<T>) {
  const [selectedIndex, setSelectedIndex] =
    React.useState(defaultSelectedIndex);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);

  const select = React.useCallback(
    (index: number) => {
      setSelectedIndex(index);
      onSelect?.(items[index], index);
    },
    [items, onSelect],
  );

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent) => {
      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          setHighlightedIndex((prev) =>
            prev < items.length - 1 ? prev + 1 : prev,
          );
          break;
        case "ArrowUp":
          event.preventDefault();
          setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : prev));
          break;
        case "Enter":
        case " ":
          event.preventDefault();
          if (highlightedIndex >= 0) {
            select(highlightedIndex);
          }
          break;
        case "Home":
          event.preventDefault();
          setHighlightedIndex(0);
          break;
        case "End":
          event.preventDefault();
          setHighlightedIndex(items.length - 1);
          break;
      }
    },
    [items.length, highlightedIndex, select],
  );

  return {
    selectedIndex,
    highlightedIndex,
    select,
    setHighlightedIndex,
    listboxProps: {
      role: "listbox" as const,
      tabIndex: 0,
      onKeyDown: handleKeyDown,
    },
    getOptionProps: (index: number) => ({
      role: "option" as const,
      "aria-selected": index === selectedIndex,
      onClick: () => select(index),
      onMouseEnter: () => setHighlightedIndex(index),
    }),
  };
}
```

## 使用 CVA 的变体系统

Class Variance Authority (CVA) 提供类型安全的变体管理。

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// 定义变体
const badgeVariants = cva(
  // 基础类
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive text-destructive-foreground',
        outline: 'text-foreground',
        success: 'border-transparent bg-green-500 text-white',
        warning: 'border-transparent bg-amber-500 text-white',
      },
      size: {
        sm: 'text-xs px-2 py-0.5',
        md: 'text-sm px-2.5 py-0.5',
        lg: 'text-sm px-3 py-1',
      },
    },
    compoundVariants: [
      // 带尺寸的 Outline 变体
      {
        variant: 'outline',
        size: 'lg',
        className: 'border-2',
      },
    ],
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

// 带变体的组件
interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size, className }))} {...props} />
  );
}

// 使用示例
<Badge variant="success" size="lg">活跃</Badge>
<Badge variant="destructive">错误</Badge>
<Badge variant="outline">草稿</Badge>
```

## 响应式变体

```tsx
import { cva } from "class-variance-authority";

// 响应式变体配置
const containerVariants = cva("mx-auto w-full px-4", {
  variants: {
    size: {
      sm: "max-w-screen-sm",
      md: "max-w-screen-md",
      lg: "max-w-screen-lg",
      xl: "max-w-screen-xl",
      full: "max-w-full",
    },
    padding: {
      none: "px-0",
      sm: "px-4 md:px-6",
      md: "px-4 md:px-8 lg:px-12",
      lg: "px-6 md:px-12 lg:px-20",
    },
  },
  defaultVariants: {
    size: "lg",
    padding: "md",
  },
});

// 响应式 prop 模式
interface ResponsiveValue<T> {
  base?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
}

function getResponsiveClasses<T extends string>(
  prop: T | ResponsiveValue<T> | undefined,
  classMap: Record<T, string>,
  responsiveClassMap: Record<string, Record<T, string>>,
): string {
  if (!prop) return "";

  if (typeof prop === "string") {
    return classMap[prop];
  }

  return Object.entries(prop)
    .map(([breakpoint, value]) => {
      if (breakpoint === "base") {
        return classMap[value as T];
      }
      return responsiveClassMap[breakpoint]?.[value as T];
    })
    .filter(Boolean)
    .join(" ");
}
```

## 组合模式

### Render Props

```tsx
interface DataListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  renderEmpty?: () => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function DataList<T>({
  items,
  renderItem,
  renderEmpty,
  keyExtractor,
}: DataListProps<T>) {
  if (items.length === 0 && renderEmpty) {
    return <>{renderEmpty()}</>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item, index) => (
        <li key={keyExtractor(item)}>{renderItem(item, index)}</li>
      ))}
    </ul>
  );
}

// 使用示例
<DataList
  items={users}
  keyExtractor={(user) => user.id}
  renderItem={(user) => <UserCard user={user} />}
  renderEmpty={() => <EmptyState message="未找到用户" />}
/>;
```

### Children 作为函数

```tsx
interface DisclosureProps {
  children: (props: { isOpen: boolean; toggle: () => void }) => React.ReactNode;
  defaultOpen?: boolean;
}

function Disclosure({ children, defaultOpen = false }: DisclosureProps) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);
  const toggle = () => setIsOpen((prev) => !prev);

  return <>{children({ isOpen, toggle })}</>;
}

// 使用示例
<Disclosure>
  {({ isOpen, toggle }) => (
    <>
      <button onClick={toggle}>{isOpen ? "关闭" : "打开"}</button>
      {isOpen && <div>内容</div>}
    </>
  )}
</Disclosure>;
```

## 最佳实践

1. **优先使用组合**：从简单原语构建复杂组件
2. **使用受控/非受控模式**：支持两种模式以获得灵活性
3. **转发 Refs**：始终将 refs 转发到根元素
4. **展开 Props**：允许自定义 props 通过
5. **提供默认值**：为可选 props 设置合理的默认值
6. **为所有内容添加类型**：使用 TypeScript 进行 prop 验证
7. **记录变体**：在 Storybook 中展示所有变体组合
8. **测试无障碍**：验证键盘导航和屏幕阅读器支持

## 资源

- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Headless UI](https://headlessui.com/)
- [Class Variance Authority](https://cva.style/docs)
- [React Aria](https://react-spectrum.adobe.com/react-aria/)
