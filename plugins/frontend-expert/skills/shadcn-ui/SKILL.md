---
name: shadcn-ui
description: 当任务涉及 shadcn/ui 组件集成、components.json 配置、Registry 或 Radix/Base UI 迁移时使用。
allowed-tools:
  - "shadcn*:*"
  - "mcp_shadcn*"
  - "Read"
  - "Write"
  - "Bash"
  - "web_fetch"
---

# shadcn/ui 集成

## 适用场景

- 初始化或接管一个使用 shadcn/ui 的前端项目。
- 需要添加 Button、Dialog、Form、Table 等组件。
- 需要从 Radix / Base UI、Tailwind v3 / v4、Registry 迁移或排障。
- 需要核对 `components.json`、别名、`cn()` 工具和全局样式是否完整。

## 核心约束

- shadcn/ui 不是运行时组件库，而是把组件源码拷进你的仓库；后续维护责任在项目内。
- 优先用 CLI 安装组件，不要手抄半套源码。
- 组件接入前先确认项目的 Tailwind、别名、`components.json` 和 `cn()` 是否可用。
- 有设计系统时，先映射现有 token、字体和 spacing，不要把 shadcn 默认值原样散落全项目。
- 文档、脚本和示例统一按当前项目形态工作：Tailwind v4 可仅靠 CSS-first 配置，不强制 `tailwind.config.*`。

## 代码模式

```bash
npx shadcn@latest init
npx shadcn@latest add button dialog form
bash ./scripts/verify-setup.sh
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

## 检查清单

- [ ] `components.json`、路径别名和 `cn()` 工具都已就位。
- [ ] Tailwind v3/v4 配置与项目实际版本一致。
- [ ] 新增组件通过 CLI 或受控模板引入，不是随手复制旧代码。
- [ ] 组件样式已映射到项目 token、主题和字体体系。
- [ ] 表单、弹层、表格等复杂组件的依赖都已安装。
- [ ] 关键示例可对照 `examples/` 与 `resources/` 落地。

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

- [design-system-patterns](../design-system-patterns/SKILL.md)
- [tailwind-design-system](../tailwind-design-system/SKILL.md)
- [frontend-design-review](../frontend-design-review/SKILL.md)
- [README.md](README.md)
- [scripts/verify-setup.sh](scripts/verify-setup.sh)
- [resources/setup-guide.md](resources/setup-guide.md)
- [resources/customization-guide.md](resources/customization-guide.md)
- [resources/component-catalog.md](resources/component-catalog.md)
- [resources/migration-guide.md](resources/migration-guide.md)
