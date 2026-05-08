# 数据获取与缓存

## 扩展 fetch API

Next.js 扩展了原生 fetch，支持缓存和重新验证选项：

```tsx
// app/page.tsx
async function getData() {
  const res = await fetch('https://api.example.com/posts', {
    cache: 'force-cache', // 默认：永久缓存（SSG）
  })

  if (!res.ok) {
    throw new Error('Failed to fetch data')
  }

  return res.json()
}

export default async function Page() {
  const data = await getData()
  return <div>{/* 渲染数据 */}</div>
}
```

## 缓存选项

```tsx
// 1. 强制缓存（静态站点生成）
fetch('https://api.example.com/data', {
  cache: 'force-cache' // 默认行为
})

// 2. 不缓存（服务端渲染）
fetch('https://api.example.com/data', {
  cache: 'no-store' // 始终获取最新数据
})

// 3. 按时间重新验证（增量静态再生成）
fetch('https://api.example.com/data', {
  next: { revalidate: 3600 } // 每小时重新验证
})

// 4. 按标签重新验证
fetch('https://api.example.com/data', {
  next: { tags: ['posts'] }
})
```

## 重新验证方法

### 基于时间的重新验证（ISR）

```tsx
// 每 60 秒重新验证
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 }
  })
  return res.json()
}

// 路由段配置
export const revalidate = 60 // 秒

export default async function Page() {
  const posts = await getPosts()
  return <div>{/* render */}</div>
}
```

### 按需重新验证

```tsx
// app/api/revalidate/route.ts
import { revalidatePath } from 'next/cache'
import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const path = request.nextUrl.searchParams.get('path')

  if (path) {
    revalidatePath(path)
    return Response.json({ revalidated: true, now: Date.now() })
  }

  return Response.json({ revalidated: false })
}

// 在 Server Action 中使用
'use server'

import { revalidatePath } from 'next/cache'

export async function createPost(data: FormData) {
  await savePost(data)

  // 重新验证特定路径
  revalidatePath('/posts')

  // 重新验证整个布局
  revalidatePath('/posts', 'layout')
}

async function savePost(_data: FormData) {}
```

### 基于标签的重新验证

```tsx
// 使用标签获取数据
async function getPosts() {
  const res = await fetch('https://api.example.com/posts', {
    next: { tags: ['posts'] }
  })
  return res.json()
}

async function getAuthors() {
  const res = await fetch('https://api.example.com/authors', {
    next: { tags: ['authors'] }
  })
  return res.json()
}

// 按标签重新验证
import { revalidateTag } from 'next/cache'

export async function createPost() {
  // 重新验证所有标记为 'posts' 的请求
  revalidateTag('posts', 'max')
}
```

## 路由段配置

```tsx
// app/posts/page.tsx

// 强制动态渲染
export const dynamic = 'force-dynamic' // 'auto' | 'force-dynamic' | 'error' | 'force-static'

// 重新验证间隔
export const revalidate = 3600 // false | 0 | number（秒）

// 请求缓存
export const fetchCache = 'auto' // 'auto' | 'default-cache' | 'only-cache' | 'force-cache' | 'force-no-store' | 'default-no-store' | 'only-no-store'

// 运行时
export const runtime = 'nodejs' // 'nodejs' | 'edge'

// 首选区域
export const preferredRegion = 'auto' // 'auto' | 'home' | 'edge' | string | string[]

export default async function Page() {
  return <div>Posts</div>
}
```

## 并行数据获取

```tsx
async function getUser() {
  const response = await fetch('https://api.example.com/user')
  return response.json()
}

async function getPosts() {
  const response = await fetch('https://api.example.com/posts')
  return response.json()
}

async function getComments() {
  const response = await fetch('https://api.example.com/comments')
  return response.json()
}

export default async function Page() {
  // 使用 Promise.all 并行获取
  const [user, posts, comments] = await Promise.all([
    getUser(),
    getPosts(),
    getComments(),
  ])

  return (
    <div>
      <UserInfo user={user} />
      <Posts posts={posts} />
      <Comments comments={comments} />
    </div>
  )
}
```

## 顺序数据获取

```tsx
// 当一个请求依赖另一个请求时
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // 第一次请求
  const user = await fetch(`https://api.example.com/users/${id}`)
    .then(res => res.json())

  // 第二次请求依赖第一次的结果
  const posts = await fetch(`https://api.example.com/users/${user.id}/posts`)
    .then(res => res.json())

  return (
    <div>
      <h1>{user.name}</h1>
      <Posts posts={posts} />
    </div>
  )
}
```

## 使用 Suspense 进行流式渲染

```tsx
// app/page.tsx
import { Suspense } from 'react'

async function Posts() {
  const posts = await fetch('https://api.example.com/posts', {
    cache: 'no-store'
  }).then(res => res.json())

  return (
    <ul>
      {posts.map((post: Post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}

export default function Page() {
  return (
    <div>
      <h1>Posts</h1>
      <Suspense fallback={<div>Loading posts...</div>}>
        <Posts />
      </Suspense>
    </div>
  )
}
```

## React cache 去重

```tsx
// lib/data.ts
import { cache } from 'react'

export const getUser = cache(async (id: string) => {
  const res = await fetch(`https://api.example.com/users/${id}`)
  return res.json()
})

// components/user-profile.tsx
export async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId) // 缓存命中
  return <div>{user.name}</div>
}

// components/user-posts.tsx
export async function UserPosts({ userId }: { userId: string }) {
  const user = await getUser(userId) // 使用缓存结果
  return <div>{user.posts.length} posts</div>
}

// app/page.tsx
export default function Page() {
  return (
    <>
      <UserProfile userId="123" />
      <UserPosts userId="123" /> {/* 相同请求，已去重 */}
    </>
  )
}
```

## 数据库查询

```tsx
// lib/db.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const db = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

// app/posts/page.tsx
import { db } from '@/lib/db'

export const revalidate = 60 // 每 60 秒重新验证

export default async function PostsPage() {
  const posts = await db.post.findMany({
    include: { author: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div>
      {posts.map(post => (
        <article key={post.id}>
          <h2>{post.title}</h2>
          <p>By {post.author.name}</p>
        </article>
      ))}
    </div>
  )
}
```

## 错误处理

```tsx
async function getData() {
  const res = await fetch('https://api.example.com/data')

  if (!res.ok) {
    // 这将触发最近的 error.tsx
    throw new Error('Failed to fetch data')
  }

  return res.json()
}

export default async function Page() {
  const data = await getData()
  return <div>{data.title}</div>
}

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

## 加载状态

```tsx
// app/posts/loading.tsx
export default function Loading() {
  return <div>Loading posts...</div>
}

// app/posts/page.tsx
export default async function PostsPage() {
  const posts = await fetch('https://api.example.com/posts')
    .then(res => res.json())

  return <div>{/* 渲染文章 */}</div>
}
```

## 客户端数据获取

```tsx
// 需要客户端获取数据时
'use client'

import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(res => res.json())

export function Posts() {
  const { data, error, isLoading } = useSWR('/api/posts', fetcher, {
    refreshInterval: 3000, // 每 3 秒刷新
  })

  if (error) return <div>Failed to load</div>
  if (isLoading) return <div>Loading...</div>

  return (
    <ul>
      {data.map((post: Post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  )
}
```

## 预加载数据

```tsx
// lib/data.ts
import { cache } from 'react'

export const preload = (id: string) => {
  void getUser(id) // 触发请求但不等待
}

export const getUser = cache(async (id: string) => {
  return fetch(`https://api.example.com/users/${id}`)
    .then(res => res.json())
})

// components/user.tsx
import { getUser, preload } from '@/lib/data'

export async function User({ id }: { id: string }) {
  const user = await getUser(id)
  return <div>{user.name}</div>
}

// app/page.tsx
import { User } from '@/components/user'
import { preload } from '@/lib/data'

export default async function Page() {
  preload('123') // 立即开始加载
  return <User id="123" />
}
```

## 带动态路由的静态生成

```tsx
// app/posts/[slug]/page.tsx
type Post = {
  slug: string
  title: string
  content: string
}

export async function generateStaticParams() {
  const posts = await fetch('https://api.example.com/posts')
    .then(res => res.json())

  return posts.map((post: Post) => ({
    slug: post.slug,
  }))
}

export default async function Post({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await fetch(`https://api.example.com/posts/${slug}`)
    .then(res => res.json())

  return (
    <article>
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  )
}
```

## 快速参考

| 策略 | 配置 | 使用场景 |
|------|------|----------|
| **SSG** | `cache: 'force-cache'` | 静态内容 |
| **SSR** | `cache: 'no-store'` | 始终最新数据 |
| **ISR** | `next: { revalidate: 60 }` | 定期更新 |
| **基于标签** | `next: { tags: ['posts'] }` | 按需重新验证 |
| **动态** | `export const dynamic = 'force-dynamic'` | 每次请求的数据 |

## 最佳实践

1. **默认启用缓存** - 对静态内容使用 force-cache
2. **使用 ISR** - 对半动态内容定期重新验证
3. **并行获取** - 对独立请求使用 Promise.all
4. **去重** - 对重复调用使用 React cache()
5. **使用 Suspense 流式传输** - 逐步展示内容
6. **标记请求** - 启用精细化的重新验证
7. **处理错误** - 使用 error.tsx 进行优雅降级
