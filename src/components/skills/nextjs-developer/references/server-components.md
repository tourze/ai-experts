# React Server Components

## Server Components（默认）

```tsx
// app/page.tsx - 默认为 Server Component
import { db } from '@/lib/db'

export default async function Page() {
  // 在 Server Component 中获取数据
  const users = await db.user.findMany()

  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  )
}
```

## Server Components 的优势

- **零 bundle 大小** - Server Components 不向客户端 bundle 添加 JavaScript
- **直接后端访问** - 查询数据库、读取文件、使用密钥
- **自动代码分割** - 只有 Client Components 会添加到 bundle 中
- **流式渲染** - 随着数据加载逐步发送 UI
- **无客户端瀑布流** - 在服务器端并行获取所有数据

## Client Components

```tsx
// components/counter.tsx
'use client' // 必需指令

import { useState } from 'react'

export function Counter() {
  const [count, setCount] = useState(0)

  return (
    <button onClick={() => setCount(count + 1)}>
      Count: {count}
    </button>
  )
}
```

## 何时使用 Client Components

在需要以下功能时使用 `'use client'`：
- **交互性** - onClick、onChange、事件处理器
- **状态** - useState、useReducer
- **副作用** - useEffect、useLayoutEffect
- **浏览器 API** - localStorage、window、document
- **自定义 hooks** - 任何使用客户端特有功能的 hook
- **类组件** - 组件生命周期方法

## 组合模式

```tsx
// app/page.tsx - Server Component
import { ClientWrapper } from './client-wrapper'

type DashboardData = {
  greeting: string
}

async function getDashboardData(): Promise<DashboardData> {
  return { greeting: 'Hello from the server' }
}

export default async function Page() {
  const data = await getDashboardData()

  return (
    <div>
      {/* Server Component 内容 */}
      <h1>Server Content</h1>

      {/* 将数据传给 Client Component */}
      <ClientWrapper initialData={data}>
        <aside>Server-rendered sidebar</aside>
      </ClientWrapper>
    </div>
  )
}

// components/client-wrapper.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function ClientWrapper({
  children,
  initialData,
}: {
  children: React.ReactNode
  initialData: { greeting: string }
}) {
  const [data] = useState(initialData)
  const router = useRouter()

  return (
    <div>
      {/* Client Component UI */}
      <button onClick={() => router.refresh()}>Refresh</button>
      <p>{data.greeting}</p>
      {/* Server Component 子元素 */}
      {children}
    </div>
  )
}
```

## 使用 Suspense 进行流式渲染

```tsx
// app/page.tsx
import { Suspense } from 'react'
import { SlowComponent } from './slow-component'
import { FastComponent } from './fast-component'

export default function Page() {
  return (
    <div>
      {/* 立即渲染 */}
      <FastComponent />

      {/* 加载时显示回退内容 */}
      <Suspense fallback={<div>Loading...</div>}>
        <SlowComponent />
      </Suspense>
    </div>
  )
}

// components/slow-component.tsx
async function getData() {
  await new Promise(resolve => setTimeout(resolve, 3000))
  return { data: 'Loaded!' }
}

export async function SlowComponent() {
  const data = await getData()
  return <div>{data.data}</div>
}
```

## 并行数据获取

```tsx
// app/dashboard/page.tsx
async function getUser() {
  const response = await fetch('https://api.example.com/user')
  return response.json()
}

async function getPosts() {
  const response = await fetch('https://api.example.com/posts')
  return response.json()
}

export default async function Dashboard() {
  // 并行获取
  const [user, posts] = await Promise.all([
    getUser(),
    getPosts(),
  ])

  return (
    <div>
      <UserProfile user={user} />
      <PostsList posts={posts} />
    </div>
  )
}
```

## 顺序数据获取

```tsx
// app/artist/[id]/page.tsx
async function getArtist(id: string) {
  const response = await fetch(`https://api.example.com/artists/${id}`)
  return response.json()
}

async function getAlbums(artistId: string) {
  const response = await fetch(`https://api.example.com/artists/${artistId}/albums`)
  return response.json()
}

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  // 顺序执行：专辑依赖艺术家信息
  const artist = await getArtist(id)
  const albums = await getAlbums(artist.id)

  return (
    <div>
      <h1>{artist.name}</h1>
      <Albums albums={albums} />
    </div>
  )
}
```

## 预加载数据

```tsx
// lib/data.ts
import { cache } from 'react'

export const getUser = cache(async (id: string) => {
  return db.user.findUnique({ where: { id } })
})

// components/user-profile.tsx
export async function UserProfile({ userId }: { userId: string }) {
  const user = await getUser(userId)
  return <div>{user.name}</div>
}

// app/page.tsx
import { getUser } from '@/lib/data'
import { UserProfile } from '@/components/user-profile'

export default async function Page() {
  // 预加载
  getUser('123')

  return (
    <div>
      {/* 这里将使用缓存结果 */}
      <UserProfile userId="123" />
    </div>
  )
}
```

## Server Component 模式

### 模式：带数据获取的布局

```tsx
// app/dashboard/layout.tsx
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  const user = await db.user.findUnique({ where: { id: session.userId } })

  return (
    <div>
      <Sidebar user={user} />
      <main>{children}</main>
    </div>
  )
}
```

### 模式：条件性 Client Component

```tsx
// app/page.tsx
import { ClientComponent } from './client-component'

export default async function Page() {
  const data = await fetchData()

  // 仅在需要时渲染 Client Component
  if (data.requiresInteractivity) {
    return <ClientComponent data={data} />
  }

  return <div>{data.content}</div>
}
```

### 模式：带客户端孤岛的 Server Component

```tsx
// app/blog/[slug]/page.tsx
import { LikeButton } from './like-button'

export default async function BlogPost({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const post = await getPost(slug)

  return (
    <article>
      {/* 服务端渲染的内容 */}
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />

      {/* 用于交互的客户端孤岛 */}
      <LikeButton postId={post.id} initialLikes={post.likes} />
    </article>
  )
}
```

## Server/Client 组件中的 Context

```tsx
// app/providers.tsx
'use client'

import { ThemeProvider } from 'next-themes'

export function Providers({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>
}

// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

## 第三方组件

```tsx
// components/carousel-wrapper.tsx
'use client'

import { Carousel } from 'third-party-carousel'

export function CarouselWrapper({ items }: { items: Item[] }) {
  return <Carousel items={items} />
}

// app/page.tsx
import { CarouselWrapper } from '@/components/carousel-wrapper'

export default async function Page() {
  const items = await fetchItems()
  return <CarouselWrapper items={items} />
}
```

## Edge Runtime

```tsx
// app/api/route.ts
export const runtime = 'edge'

export async function GET() {
  return new Response('Hello from Edge!')
}

// app/page.tsx
export const runtime = 'edge'

export default async function Page() {
  return <div>Edge-rendered page</div>
}
```

## 快速参考

| 能力 | Server Component | Client Component |
|------|------------------|------------------|
| 数据获取 | ✅ 是 | ⚠️ 使用 SWR/React Query |
| 后端访问 | ✅ 是（数据库、文件） | ❌ 否 |
| 事件处理器 | ❌ 否 | ✅ 是 |
| 状态/副作用 | ❌ 否 | ✅ 是 |
| 浏览器 API | ❌ 否 | ✅ 是 |
| Bundle 大小 | 0 KB | 添加到 bundle |
| 流式渲染 | ✅ 是 | ❌ 否 |

## 最佳实践

1. **默认使用 Server Components** - 仅在需要时使用 'use client'
2. **将 Client Components 下移** - 推到组件树的叶子节点
3. **向下传递数据** - 在 Server Components 中获取数据，传给 Client Components
4. **使用组合** - 通过 children 在 Client Components 中嵌套 Server Components
5. **缓存昂贵操作** - 使用 React cache() 进行去重
