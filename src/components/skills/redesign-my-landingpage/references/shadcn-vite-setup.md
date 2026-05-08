# shadcn/ui + Vite 搭建（React + TypeScript）

当用户需要完整的 Vite 项目脚手架（而不仅仅是单个组件）时使用。

## Tailwind 版本说明

- 默认：Tailwind v4 安装。
- 如果项目使用 Tailwind v3，请将 shadcn CLI 版本锁定为与该技术栈兼容的版本（shadcn 文档中有说明）。

## 1) 创建 Vite 项目

创建一个新的 React + TypeScript 应用：

```bash
pnpm create vite@latest
```

然后安装依赖并运行开发服务器：

```bash
pnpm install
pnpm dev
```

## 2) 添加 Tailwind CSS（Tailwind v4）

安装 Tailwind 和 Vite 插件：

```bash
pnpm add tailwindcss @tailwindcss/vite
```

将 `src/index.css` 替换为：

```css
@import "tailwindcss";
```

## 3) 配置 `@/...` 路径别名

编辑 `tsconfig.json` 并添加：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

同时编辑 `tsconfig.app.json`，在 `compilerOptions` 下添加相同的 `baseUrl` + `paths` 映射。

## 4) 更新 `vite.config.ts`

安装 Node 类型定义：

```bash
pnpm add -D @types/node
```

更新 `vite.config.ts` 以包含 Tailwind 和别名：

```ts
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

## 5) 初始化 shadcn/ui

运行初始化命令：

```bash
pnpm dlx shadcn@latest init
```

这将创建 `components.json` 并设置 shadcn 主题标记。

## 6) 添加你将使用的组件

对于一个典型的落地页，添加一个较小的集合：

```bash
pnpm dlx shadcn@latest add button
pnpm dlx shadcn@latest add card
pnpm dlx shadcn@latest add badge
pnpm dlx shadcn@latest add separator
pnpm dlx shadcn@latest add accordion
pnpm dlx shadcn@latest add sheet
pnpm dlx shadcn@latest add avatar
pnpm dlx shadcn@latest add input
```

然后像这样导入：

```ts
import { Button } from "@/components/ui/button"
```

## 7) Iconify（图标）

安装：

```bash
pnpm add @iconify/react
```

按名称使用图标（按需加载）：

```tsx
import { Icon } from "@iconify/react"

<Icon icon="lucide:arrow-right" aria-hidden="true" />
```

## 可选：深色模式

如果用户要求深色模式，请遵循 shadcn 的 Vite 深色模式指南，并实现主题切换功能。
