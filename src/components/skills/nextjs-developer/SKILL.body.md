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

### 模式 4：Route Handler

异步 `params: Promise<{ id: string }>` + `await params`，详见 [references/app-router.md](references/app-router.md)。

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

### FAIL: 整棵树 'use client'

```tsx
// app/layout.tsx — 整个应用 CSR，RSC 优势归零
'use client'
export default function RootLayout({ children }) { ... }
```

### PASS: 'use client' 压到叶子

```tsx
// app/layout.tsx 仍是 Server Component
// components/theme-toggle.tsx 才标 'use client'
```

### FAIL: Server Action 无校验

```tsx
'use server'
export async function createPost(formData: FormData) {
  await db.post.create({ data: { title: formData.get('title') } }); // 无鉴权 + 无 revalidate
}
```

### PASS: 校验 + 鉴权 + revalidate

```tsx
'use server'
export async function createPost(_prev, formData: FormData) {
  const session = await auth(); if (!session) return { error: 'unauthorized' };
  const parsed = PostSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.message };
  await db.post.create({ data: { ...parsed.data, authorId: session.userId } });
  revalidatePath('/posts');
  return {};
}
```
