# Iconify 图标（Iconify 图标集）

使用 https://icon-sets.iconify.design/ 上的图标。

## React + Vite 的推荐方式

使用 `@iconify/react`。
它按需从 Iconify API 加载图标数据，因此你只需为实际使用的图标付费。

### 安装

```bash
pnpm add @iconify/react
```

### 基本用法

```tsx
import { Icon } from "@iconify/react"

export function Example() {
  return <Icon icon="mdi:home" />
}
```

## 全应用规则

- 每个页面使用 1 个图标集（最多 2 个）。示例集合：`mdi:`、`tabler:`、`ph:`、`lucide:`。
- 样式与审美方向匹配（轮廓 vs 填充、圆角 vs 尖锐）。
- 不要到处撒播图标。如果它不增加意义，就删除它。

## 包装组件（推荐）

创建 `src/components/app-icon.tsx`：

```tsx
import { Icon, type IconProps } from "@iconify/react"

type AppIconProps = IconProps & {
  decorative?: boolean
  label?: string
}

export function AppIcon({ decorative = true, label, ...props }: AppIconProps) {
  if (decorative) {
    return <Icon aria-hidden="true" {...props} />
  }
  return <Icon aria-label={label ?? "Icon"} role="img" {...props} />
}
```

### 在 shadcn Button 中的示例

```tsx
import { Button } from "@/components/ui/button"
import { AppIcon } from "@/components/app-icon"

export function PrimaryCTA() {
  return (
    <Button size="lg" className="gap-2">
      Start free
      <AppIcon icon="mdi:arrow-right" className="size-4" decorative />
    </Button>
  )
}
```

## 快速选取图标

- 按概念搜索，然后锁定一个前缀。
- 小尺寸优先选择简单形状。
- 对于功能列表，复用一致的样式：全部轮廓或全部填充。

## 如果需要避免第三方 API

使用 Iconify 离线模式（打包特定图标）或自托管 Iconify API。
仅在用户要求时才这样做。
