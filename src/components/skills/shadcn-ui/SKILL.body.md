## 代码模式

```bash
npx shadcn@latest init
npx shadcn@latest add button dialog form
node ./scripts/verify-setup.mjs
```

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```tsx
import { useToast } from "@/components/ui/use-toast";

const { toast } = useToast();
toast({ title: "Saved", description: "Changes applied." });
```

## 反模式

### FAIL: 手抄半套源码

```tsx
// 从 GitHub 复制 Button 源码，没装 class-variance-authority
import { cva } from "class-variance-authority"; // 运行时报错
```

### PASS: CLI 安装

```bash
npx shadcn@latest add button
# 自动装依赖 + 更新 components.json + 应用项目 token
```

### FAIL: 保留 shadcn 默认视觉

```tsx
// 项目已有品牌色，但组件全是默认 slate
<Button className="bg-slate-900">
```

### PASS: 映射到项目 token

```ts
// tailwind.config.ts
theme: { extend: { colors: { primary: "hsl(var(--brand))" } } }
// globals.css:  :root { --brand: 221 83% 53%; }
```

## 参考资料

- [README.md](README.md)
- [scripts/verify-setup.mjs](scripts/verify-setup.mjs)
- [resources/setup-guide.md](resources/setup-guide.md)
- [resources/customization-guide.md](resources/customization-guide.md)
- [resources/component-catalog.md](resources/component-catalog.md)
- [resources/migration-guide.md](resources/migration-guide.md)
