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
