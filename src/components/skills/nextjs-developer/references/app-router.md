# App Router 架构

## 文件路由

> Next.js 15+ 将动态路由的 `params` 作为 Promise 传入 `page`、`layout`、`route` 和 `generateMetadata`。下面的示例默认使用这种写法；如果维护 Next.js 14 项目，可在确认版本后退回同步签名。

```
app/
├── layout.tsx              # 根布局（必需）
├── page.tsx               # 首页（/）
├── loading.tsx            # 加载状态 UI
├── error.tsx              # 错误边界
├── not-found.tsx          # 404 页面
├── template.tsx           # 重新挂载的布局
│
├── (marketing)/           # 路由组（无 URL 段）
│   ├── layout.tsx
│   ├── about/
│   │   └── page.tsx      # /about
│   └── contact/
│       └── page.tsx      # /contact
│
├── dashboard/
│   ├── layout.tsx        # 共享仪表板布局
│   ├── page.tsx          # /dashboard
│   ├── settings/
│   │   └── page.tsx      # /dashboard/settings
│   └── @analytics/       # 并行路由（插槽）
│       └── page.tsx
│
├── blog/
│   ├── [slug]/
│   │   └── page.tsx      # /blog/my-post（动态）
│   └── [...slug]/
│       └── page.tsx      # /blog/a/b/c（全匹配）
│
└── api/
    └── users/
        └── route.ts      # API 路由处理
```

## 根布局（必需）

```tsx
// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'My App',
    template: '%s | My App'
  },
  description: 'Next.js 14 application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  )
}
```

## 嵌套布局

```tsx
// app/dashboard/layout.tsx
import { Sidebar } from '@/components/sidebar'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  )
}
```

## 模板（导航时重新挂载）

```tsx
// app/template.tsx
'use client'

import { useEffect } from 'react'

export default function Template({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // 每次导航时执行
    console.log('Template mounted')
  }, [])

  return <div>{children}</div>
}
```

## 加载状态

```tsx
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2" />
    </div>
  )
}
```

## 错误边界

```tsx
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={() => reset()}>Try again</button>
    </div>
  )
}
```

## 路由组

```tsx
// (marketing) 和 (shop) 共享同一 URL 层级
app/
├── (marketing)/
│   ├── layout.tsx      # 营销布局
│   └── about/
│       └── page.tsx    # /about
└── (shop)/
    ├── layout.tsx      # 商城布局
    └── products/
        └── page.tsx    # /products
```

## 并行路由

```tsx
// app/dashboard/layout.tsx
export default function Layout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode
  analytics: React.ReactNode
  team: React.ReactNode
}) {
  return (
    <>
      {children}
      {analytics}
      {team}
    </>
  )
}

// app/dashboard/@analytics/page.tsx
export default function Analytics() {
  return <div>Analytics Dashboard</div>
}
```

## 拦截路由

```tsx
// 从同一应用内导航时显示弹窗
// 直接导航时显示完整页面

type PhotoPageProps = {
  params: Promise<{ id: string }>
}

// app/photos/[id]/page.tsx（完整页面）
export default async function PhotoPage({ params }: PhotoPageProps) {
  const { id } = await params
  return <div>Photo {id} - Full Page</div>
}

// app/@modal/(.)photos/[id]/page.tsx（弹窗）
export default async function PhotoModal({ params }: PhotoPageProps) {
  const { id } = await params
  return <div>Photo {id} - Modal</div>
}
```

## 动态路由

```tsx
// app/blog/[slug]/page.tsx
export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  return <h1>Post: {slug}</h1>
}

// 构建时生成静态参数
export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts').then(res => res.json())

  return posts.map((post: { slug: string }) => ({
    slug: post.slug,
  }))
}

// 退出静态生成
export const dynamic = 'force-dynamic'

// 每 60 秒重新验证
export const revalidate = 60
```

## 全匹配路由

```tsx
// app/docs/[...slug]/page.tsx
// 匹配：/docs/a, /docs/a/b, /docs/a/b/c
export default async function Docs({
  params,
}: {
  params: Promise<{ slug: string[] }>
}) {
  const { slug } = await params
  return <div>Docs: {slug.join('/')}</div>
}

// 可选全匹配：[[...slug]]
// 也匹配：/docs
```

## 路由处理器（API 路由）

```tsx
// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const users = await db.user.findMany()
  return NextResponse.json(users)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const user = await db.user.create({ data: body })
  return NextResponse.json(user, { status: 201 })
}

// 动态路由：app/api/users/[id]/route.ts
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = await db.user.findUnique({ where: { id } })
  return NextResponse.json(user)
}
```

## Metadata API

```tsx
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next'

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const post = await fetchPost(slug)

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images: [{ url: post.coverImage }],
    },
  }
}
```

## 快速参考

| 文件 | 用途 | 使用场景 |
|------|------|----------|
| `layout.tsx` | 跨路由持久 UI | 共享导航、权限包装 |
| `page.tsx` | 路由 UI | 实际页面内容 |
| `loading.tsx` | 加载回退 | 自动 Suspense 边界 |
| `error.tsx` | 错误边界 | 优雅处理错误 |
| `template.tsx` | 重新挂载布局 | 分析、动画 |
| `not-found.tsx` | 404 页面 | 自定义未找到 UI |
| `route.ts` | API 处理器 | 后端 API 端点 |
