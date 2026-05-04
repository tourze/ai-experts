# 间距与图标系统参考

## 8 点网格间距系统

```css
:root {
  --space-unit: 0.25rem; /* 4px 基础单位 */
  --space-0: 0; --space-px: 1px;
  --space-1: calc(var(--space-unit) * 1);  /* 4px */
  --space-2: calc(var(--space-unit) * 2);  /* 8px */
  --space-3: calc(var(--space-unit) * 3);  /* 12px */
  --space-4: calc(var(--space-unit) * 4);  /* 16px */
  --space-6: calc(var(--space-unit) * 6);  /* 24px */
  --space-8: calc(var(--space-unit) * 8);  /* 32px */
  --space-12: calc(var(--space-unit) * 12); /* 48px */
  --space-16: calc(var(--space-unit) * 16); /* 64px */
  --space-24: calc(var(--space-unit) * 24); /* 96px */
  --space-32: calc(var(--space-unit) * 32); /* 128px */
}
```

### 语义间距 Token

```css
:root {
  --spacing-xs: var(--space-1);  /* 4px 紧凑 */
  --spacing-sm: var(--space-2);  /* 8px 紧密 */
  --spacing-md: var(--space-4);  /* 16px 默认 */
  --spacing-lg: var(--space-6);  /* 24px 舒适 */
  --spacing-xl: var(--space-8);  /* 32px 宽松 */
  --spacing-2xl: var(--space-12); /* 48px 充裕 */
  --spacing-3xl: var(--space-16); /* 64px 段落间距 */
  --spacing-inline: var(--space-2); /* 行内间距 */
  --spacing-stack: var(--space-4);  /* 堆叠间距 */
  --spacing-section: var(--space-16); /* 段落 */
}
```

### 容器查询适配间距

```css
.card { container-type: inline-size; padding: var(--space-4); }
@container (min-width: 400px) { .card { padding: var(--space-6); } }
@container (min-width: 600px) { .card { padding: var(--space-8); } }
```

### 负空间与垂直节奏

```css
.hero-section { padding-top: var(--space-24); padding-bottom: var(--space-16); }
.prose > * + * { margin-top: var(--space-4); }
.prose > * + h2 { margin-top: var(--space-8); }
```

## 图标系统

### 尺寸尺度

```css
:root {
  --icon-xs: 12px; --icon-sm: 16px; --icon-md: 20px;
  --icon-lg: 24px; --icon-xl: 32px; --icon-2xl: 48px;
  --touch-target-min: 44px; /* WCAG 最低要求 */
}
```

### SVG 图标组件

```tsx
const sizeMap = { xs: 12, sm: 16, md: 20, lg: 24, xl: 32, "2xl": 48 };

export const Icon = forwardRef<SVGSVGElement, {
  name: string; size?: keyof typeof sizeMap; label?: string;
} & SVGProps<SVGSVGElement>>(({ name, size = "md", label, className, ...props }, ref) => (
  <svg ref={ref} width={sizeMap[size]} height={sizeMap[size]}
    className={`inline-block flex-shrink-0 ${className}`}
    aria-hidden={!label} aria-label={label} role={label ? "img" : undefined} {...props}>
    <use href={`/icons.svg#${name}`} />
  </svg>
));
```

### 图标按钮

```tsx
const sizeClasses = { sm: "p-1.5", md: "p-2", lg: "p-2.5" };

export function IconButton({ icon, label, size = "md", variant = "ghost", className, ...props }: {
  icon: string; label: string; size?: "sm" | "md" | "lg"; variant?: "solid" | "ghost" | "outline";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className={`inline-flex items-center justify-center rounded-lg
      transition-colors focus-visible:outline-none focus-visible:ring-2
      ${sizeClasses[size]}
      ${variant === "solid" && "bg-blue-600 text-white hover:bg-blue-700"}
      ${variant === "ghost" && "hover:bg-gray-100"}
      ${variant === "outline" && "border border-gray-300 hover:bg-gray-50"}
      ${className}`} aria-label={label} {...props}>
      <Icon name={icon} size={size === "sm" ? "sm" : size === "lg" ? "lg" : "md"} />
    </button>
  );
}
```

### 图标库集成

```tsx
// Lucide React
import { Home, Settings, User, Search } from "lucide-react";
// Heroicons
import { HomeIcon, Cog6ToothIcon } from "@heroicons/react/24/outline";
// Radix Icons
import { HomeIcon, GearIcon } from "@radix-ui/react-icons";
```

## 尺寸系统

```css
:root {
  --size-6: 1.5rem; --size-8: 2rem; --size-10: 2.5rem; --size-12: 3rem;
  --size-16: 4rem; --size-24: 6rem;
  --height-input-sm: var(--size-8); --height-input-md: var(--size-10);
  --avatar-sm: var(--size-8); --avatar-md: var(--size-10); --avatar-lg: var(--size-12);
  --aspect-square: 1 / 1; --aspect-video: 16 / 9; --aspect-photo: 4 / 3;
  --radius-sm: 0.125rem; --radius-md: 0.375rem; --radius-lg: 0.5rem;
  --radius-xl: 0.75rem; --radius-2xl: 1rem; --radius-full: 9999px;
  --radius-button: var(--radius-md); --radius-card: var(--radius-lg);
}
```
