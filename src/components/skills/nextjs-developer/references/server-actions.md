# Server Actions

## 基本 Server Action

```tsx
// app/actions.ts
'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  const content = formData.get('content') as string

  await db.post.create({
    data: { title, content }
  })

  revalidatePath('/posts')
}
```

## 带 Server Action 的表单

```tsx
// app/posts/new/page.tsx
import { createPost } from '@/app/actions'

export default function NewPost() {
  return (
    <form action={createPost}>
      <input name="title" required />
      <textarea name="content" required />
      <button type="submit">Create Post</button>
    </form>
  )
}
```

## 带验证的 Server Action

```tsx
// app/actions.ts
'use server'

import { db } from '@/lib/db'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const CreatePostSchema = z.object({
  title: z.string().min(3).max(100),
  content: z.string().min(10),
})

export async function createPost(formData: FormData) {
  const validatedFields = CreatePostSchema.safeParse({
    title: formData.get('title'),
    content: formData.get('content'),
  })

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    }
  }

  const { title, content } = validatedFields.data

  await db.post.create({
    data: { title, content }
  })

  revalidatePath('/posts')
  return { success: true }
}
```

## 客户端组件中的 Server Action

```tsx
// app/actions.ts
'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export type CreatePostState = {
  errors?: {
    title?: string[]
    content?: string[]
  }
}

export async function createPost(
  _prevState: CreatePostState,
  formData: FormData,
): Promise<CreatePostState> {
  const title = formData.get('title')
  const content = formData.get('content')

  if (typeof title !== 'string' || title.trim().length < 3) {
    return { errors: { title: ['Title must be at least 3 characters'] } }
  }

  if (typeof content !== 'string' || content.trim().length < 10) {
    return { errors: { content: ['Content must be at least 10 characters'] } }
  }

  await db.post.create({
    data: { title: title.trim(), content: content.trim() },
  })

  revalidatePath('/posts')
  return {}
}

// components/create-post-form.tsx
'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'

import { createPost, type CreatePostState } from '@/app/actions'

const initialState: CreatePostState = {}

function SubmitButton() {
  const { pending } = useFormStatus()

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Creating...' : 'Create Post'}
    </button>
  )
}

export function CreatePostForm() {
  const [state, formAction] = useActionState(createPost, initialState)

  return (
    <form action={formAction}>
      <div>
        <input name="title" />
        {state.errors?.title && <p>{state.errors.title[0]}</p>}
      </div>

      <div>
        <textarea name="content" />
        {state.errors?.content && <p>{state.errors.content[0]}</p>}
      </div>

      <SubmitButton />
    </form>
  )
}
```

## 带重定向的 Server Action

```tsx
// app/actions.ts
'use server'

import { db } from '@/lib/db'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  const post = await db.post.create({
    data: {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
    }
  })

  revalidatePath('/posts')
  redirect(`/posts/${post.id}`)
}
```

## 乐观更新

```tsx
// components/todo-list.tsx
'use client'

import { useOptimistic } from 'react'

import { createTodo } from '@/app/actions'

type Todo = {
  id: string
  title: string
  completed: boolean
}

export function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, newTodo]
  )

  async function handleSubmit(formData: FormData) {
    const title = formData.get('title') as string
    const newTodo = { id: crypto.randomUUID(), title, completed: false }

    // 乐观更新 UI
    addOptimisticTodo(newTodo)

    // 发送到服务器
    await createTodo(formData)
  }

  return (
    <div>
      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id}>{todo.title}</li>
        ))}
      </ul>

      <form action={handleSubmit}>
        <input name="title" />
        <button type="submit">Add</button>
      </form>
    </div>
  )
}
```

## 带身份验证的 Server Action

```tsx
// app/actions.ts
'use server'

import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createPost(formData: FormData) {
  const session = await auth()

  if (!session) {
    redirect('/login')
  }

  await db.post.create({
    data: {
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      authorId: session.user.id,
    }
  })

  revalidatePath('/posts')
}
```

## 内联 Server Action

```tsx
// app/posts/page.tsx
import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export default async function Posts() {
  const posts = await db.post.findMany()

  async function deletePost(formData: FormData) {
    'use server'

    const id = formData.get('id') as string
    await db.post.delete({ where: { id } })
    revalidatePath('/posts')
  }

  return (
    <ul>
      {posts.map(post => (
        <li key={post.id}>
          {post.title}
          <form action={deletePost}>
            <input type="hidden" name="id" value={post.id} />
            <button type="submit">Delete</button>
          </form>
        </li>
      ))}
    </ul>
  )
}
```

## 程序化调用 Server Action

```tsx
// components/delete-button.tsx
'use client'

import { deletePost } from '@/app/actions'

export function DeleteButton({ postId }: { postId: string }) {
  async function handleDelete() {
    if (confirm('Are you sure?')) {
      await deletePost(postId)
    }
  }

  return (
    <button onClick={handleDelete}>
      Delete
    </button>
  )
}

// app/actions.ts
'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function deletePost(postId: string) {
  await db.post.delete({ where: { id: postId } })
  revalidatePath('/posts')
}
```

## 重新验证策略

```tsx
// app/actions.ts
'use server'

import { db } from '@/lib/db'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function updatePost(id: string, data: UpdatePostData) {
  await db.post.update({ where: { id }, data })

  // 重新验证特定路径
  revalidatePath('/posts')
  revalidatePath(`/posts/${id}`)

  // 重新验证布局中的所有路径
  revalidatePath('/posts', 'layout')

  // 按缓存标签重新验证
  revalidateTag('posts', 'max')
}
```

## 带文件上传的 Server Action

```tsx
// app/actions.ts
'use server'

import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export async function uploadAvatar(formData: FormData) {
  const file = formData.get('avatar')

  if (!(file instanceof File)) {
    return { error: 'No file uploaded' }
  }

  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  const path = join(process.cwd(), 'public', 'uploads', file.name)
  await writeFile(path, buffer)

  return { success: true, path: `/uploads/${file.name}` }
}

// components/upload-form.tsx
'use client'

import { uploadAvatar } from '@/app/actions'

export function UploadForm() {
  async function handleSubmit(formData: FormData) {
    const result = await uploadAvatar(formData)
    if (result.success) {
      console.log('Uploaded to:', result.path)
    }
  }

  return (
    <form action={handleSubmit}>
      <input type="file" name="avatar" accept="image/*" />
      <button type="submit">Upload</button>
    </form>
  )
}
```

## 错误处理

```tsx
// app/actions.ts
'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function createPost(formData: FormData) {
  try {
    await db.post.create({
      data: {
        title: formData.get('title') as string,
        content: formData.get('content') as string,
      }
    })

    revalidatePath('/posts')
    return { success: true }
  } catch (error) {
    console.error('Failed to create post:', error)
    return { error: 'Failed to create post' }
  }
}

// components/form.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

import { createPost } from '@/app/actions'

export function CreatePostForm() {
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    const result = await createPost(formData)

    if (result.error) {
      setError(result.error)
    } else {
      // 成功
      router.push('/posts')
    }
  }

  return (
    <form action={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* 表单字段 */}
    </form>
  )
}
```

## 带 Cookie 的 Server Action

```tsx
// app/actions.ts
'use server'

import { cookies } from 'next/headers'

export async function setTheme(theme: 'light' | 'dark') {
  const cookieStore = await cookies()

  cookieStore.set('theme', theme, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 365, // 1 年
    path: '/',
  })
}

export async function getTheme() {
  const cookieStore = await cookies()
  return cookieStore.get('theme')?.value ?? 'light'
}
```

## 速率限制

```tsx
// app/actions.ts
'use server'

import { auth } from '@/lib/auth'
import { ratelimit } from '@/lib/redis'

export async function createPost(formData: FormData) {
  const session = await auth()
  if (!session) {
    return { error: 'Unauthorized' }
  }

  const { success } = await ratelimit.limit(session.user.id)

  if (!success) {
    return { error: 'Rate limit exceeded' }
  }

  // 创建文章...
}
```

## 快速参考

| 能力 | 用法 |
|------|------|
| **定义** | 在文件或函数顶部添加 'use server' |
| **表单** | 将 action 传给 `<form action={serverAction}>` |
| **程序化** | 直接调用：`await serverAction(data)` |
| **验证** | 在变更前使用 Zod/TypeBox |
| **重新验证** | `revalidatePath()` 或 `revalidateTag('tag', 'max')` |
| **重定向** | 变更后调用 `redirect()` |
| **错误** | 返回错误对象，在客户端处理 |
| **文件** | 通过 `formData.get()` 以 File 类型访问 |

## 最佳实践

1. **始终验证** - 使用 Zod/TypeBox 进行类型安全验证
2. **重新验证** - 变更后调用 revalidatePath()
3. **处理错误** - 返回错误对象而不是抛出异常
4. **身份验证检查** - 在变更前验证会话
5. **速率限制** - 防止滥用
6. **类型安全** - 定义输入/输出类型
7. **乐观更新** - 使用 useOptimistic 改善用户体验
