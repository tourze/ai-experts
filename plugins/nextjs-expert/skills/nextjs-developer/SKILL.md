---
name: nextjs-developer
description: 当用户提到 Next.js、App Router、Server Components、Server Actions、Route Handlers、generateMetadata、loading.tsx、error.tsx 或 Vercel 部署时使用。
license: MIT
metadata:
  author: https://github.com/Jeffallan
  version: "1.2.0"
  domain: frontend
  triggers: Next.js, App Router, Server Components, Server Actions, Route Handlers, generateMetadata, loading.tsx, error.tsx, Vercel, Next.js performance
  role: specialist
  scope: implementation
  output-format: code
  related-skills: react-server-components, vercel-react-best-practices, typescript-magician, typescript-advanced-types
---

# Next.js Developer

## 适用场景

- 需要在 `app/` 目录下设计路由树、`layout.tsx` / `template.tsx` / `loading.tsx` / `error.tsx` / `route.ts` 的职责划分时使用。
- 需要决定某段 UI 应该保持 Server Component、下沉为 Client Component，还是拆成 Server + Client island 时使用。
- 需要为数据获取、缓存、ISR、按路径/标签重验证、Server Actions、Metadata API、Middleware、Edge Runtime 或 Vercel 部署做实现选择时使用。
- 复杂 RSC 边界问题优先联动 `react-server-components`；需要生产性能收敛时联动 `vercel-react-best-practices`；需要类型体操或 DTO/泛型修复时联动 `typescript-magician`、`typescript-advanced-types`。
- 需要展开细节时按主题加载参考资料：
  [App Router](references/app-router.md)、
  [Server Components](references/server-components.md)、
  [Server Actions](references/server-actions.md)、
  [Data Fetching](references/data-fetching.md)、
  [Deployment](references/deployment.md)。

## 核心约束

- 默认使用 App Router；除非明确维护遗留项目，否则不要把新实现落到 `pages/`。
- 默认保持 Server Components，只在交互真正发生的叶子节点添加 `'use client'`。
- 所有 `fetch` 都显式写出 `cache`、`next.revalidate` 或 `next.tags` 策略，不依赖隐式缓存。
- 所有动态 SEO 都用 `metadata` / `generateMetadata`，不要在 JSX 里手写 `<title>` / `<meta>`。
- 所有内容型图片默认走 `next/image`；公共静态资源才考虑 `<img>`。
- 对会阻塞首屏的数据段补 `loading.tsx` / `error.tsx`，不要把错误与等待状态散落在页面组件内部。
- Next.js 15+ 的 `params` / `searchParams` / `cookies()` / `headers()` 已转为异步 API；面向当前版本写示例时优先使用 `Promise` / `await` 形式，并在需要兼容 Next.js 14 时显式说明。
- 交付前必须本地运行 `next build`；如果项目使用 TypeScript，还要保证零类型错误并核对 `NEXT_PUBLIC_*` 与 server-only 环境变量边界。

## 代码模式

### 模式 1：Server Component 默认承载数据获取

```tsx
// app/products/page.tsx
type Product = {
  id: string
  name: string
}

async function getProducts(): Promise<Product[]> {
  const response = await fetch('https://api.example.com/products', {
    next: { revalidate: 60, tags: ['products'] },
  })

  if (!response.ok) {
    throw new Error('Failed to fetch products')
  }

  return response.json()
}

export default async function ProductsPage() {
  const products = await getProducts()

  return (
    <ul>
      {products.map((product) => (
        <li key={product.id}>{product.name}</li>
      ))}
    </ul>
  )
}
```

### 模式 2：Server Action + `useActionState` 处理表单提交

```tsx
// app/products/actions.ts
'use server'

import { revalidatePath } from 'next/cache'

export type ActionState = {
  error?: string
}

export async function createProduct(
  _prevState: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = formData.get('name')

  if (typeof name !== 'string' || name.trim().length < 2) {
    return { error: '产品名至少 2 个字符' }
  }

  await saveProduct({ name: name.trim() })
  revalidatePath('/products')
  return {}
}

async function saveProduct(input: { name: string }) {
  void input
}

// components/product-form.tsx
'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { createProduct, type ActionState } from '@/app/products/actions'

const initialState: ActionState = {}

function SubmitButton() {
  const { pending } = useFormStatus()
  return <button type="submit" disabled={pending}>{pending ? '提交中…' : '创建产品'}</button>
}

export function ProductForm() {
  const [state, formAction] = useActionState(createProduct, initialState)

  return (
    <form action={formAction}>
      <input name="name" required minLength={2} />
      {state.error ? <p>{state.error}</p> : null}
      <SubmitButton />
    </form>
  )
}
```

### 模式 3：动态路由与 Metadata API 使用异步 `params`

```tsx
// app/products/[id]/page.tsx
import type { Metadata } from 'next'

type Product = {
  id: string
  name: string
  description: string
  imageUrl: string
}

type PageProps = {
  params: Promise<{ id: string }>
}

async function fetchProduct(id: string): Promise<Product> {
  const response = await fetch(`https://api.example.com/products/${id}`, {
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error('Failed to fetch product')
  }

  return response.json()
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const product = await fetchProduct(id)

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      images: [{ url: product.imageUrl }],
    },
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params
  const product = await fetchProduct(id)
  return <article>{product.name}</article>
}
```

### 模式 4：Route Handler 保持边界清晰

```tsx
// app/api/products/[id]/route.ts
import { NextResponse } from 'next/server'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params
  const product = await fetch(`https://api.example.com/products/${id}`, {
    cache: 'no-store',
  }).then((response) => response.json())

  return NextResponse.json(product)
}
```

## 检查清单

- 是否明确说明页面/布局/模板/路由处理器的职责边界？
- 是否默认保留 Server Component，并把 `'use client'` 压到了交互叶子节点？
- 是否给每个 `fetch` 写清了缓存、重验证或标签策略？
- 是否在动态路由、`generateMetadata`、Route Handler 里正确处理了异步 `params`？
- 是否给异步段补了 `loading.tsx` / `error.tsx` / `not-found.tsx`？
- 是否对 Server Action 做了输入校验、鉴权/授权、重验证和失败返回约定？
- 是否避免把服务端密钥暴露到 `NEXT_PUBLIC_*`？
- 是否在部署说明里覆盖 `next build`、环境变量、图片域名、运行时选择与回滚入口？

## 反模式

- 为了偷懒把整棵页面树都改成 Client Components。
- 依赖隐式缓存，不写 `cache` / `revalidate` / `tags`，导致渲染语义不清晰。
- 在 JSX 中直接硬写 `<title>` / `<meta>`，绕过 Metadata API。
- 在动态路由中继续示范同步 `params` / `cookies()` / `headers()` 写法，却不声明版本前提。
- Server Action 只做数据库写入，不做校验、权限检查或 `revalidatePath` / `revalidateTag`。
- 部署前不跑 `next build`，或在 `next/image` 远程域名、环境变量、Node/Edge 运行时之间留未验证假设。
