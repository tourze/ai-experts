## 代码模式
- 参考现成示例资产： [LandingPage.tsx](assets/vite-shadcn-iconify-landing/src/pages/LandingPage.tsx)。
- 最小实现模式：

```tsx
import { Icon } from '@iconify/react'
import { Button } from '@/components/ui/button'

<Button>
  Start free
  <Icon icon="lucide:arrow-right" className="ml-2 size-4" />
</Button>
```

- 页面结构与风格方向优先参考 [landing-page-anatomy](references/landing-page-anatomy.md)、[section-templates](references/section-templates.md)、[aesthetic-directions](references/aesthetic-directions.md)、[shadcn-vite-setup](references/shadcn-vite-setup.md)。
