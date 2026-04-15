---
name: react-server-components
description: 当用户需要使用 React Server Components、Server Actions 或流式渲染时使用。
---

# React Server Components

## 适用场景

- 项目使用 Next.js App Router，需要在服务端组件与客户端组件之间划边界。
- 需要把数据获取、鉴权、缓存、重验证或变更动作放回服务端。
- 需要利用 `Suspense`、流式渲染和并行数据获取减少 waterfalls。
- 更完整的 Next.js 框架层约束可联动 [nextjs-developer](../../../nextjs-expert/skills/nextjs-developer/SKILL.md)。
- 针对 React/Next 性能守则可联动 [vercel-react-best-practices](../vercel-react-best-practices/SKILL.md)。

## 核心约束

- 在 App Router 中默认把组件视为 Server Component；只有交互边界才显式加 `'use client'`。
- Server Component 不能使用客户端 Hook、浏览器 API 或事件处理器。
- 传给 Client Component 的 props 必须可序列化，且不要把 secrets、数据库连接或大对象往下透传。
- 服务端能直接拿到数据库、文件系统、cookies、headers 时，不要再绕自己 API 一圈。
- Server Actions 既是写路径也是安全边界；鉴权、校验、`revalidatePath` / `revalidateTag` 不能省。

## 代码模式

```tsx
// app/users/page.tsx
async function fetchUsers() {
  return [{ id: "1", name: "Ada" }];
}

async function fetchTeams() {
  return [{ id: "team-1", name: "Platform" }];
}

export default async function UsersPage() {
  const [users, teams] = await Promise.all([
    fetchUsers(),
    fetchTeams(),
  ]);

  return (
    <section>
      <h1>Users</h1>
      <pre>{JSON.stringify({ users, teams }, null, 2)}</pre>
    </section>
  );
}
```

```tsx
// components/filter-panel.tsx
"use client";

import { useState } from "react";

export function FilterPanel({ categories }: { categories: string[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <aside>
      {categories.map((category) => (
        <button key={category} onClick={() => setSelected(category)}>
          {selected === category ? `✓ ${category}` : category}
        </button>
      ))}
    </aside>
  );
}
```

```tsx
// app/actions.ts
"use server";

import { revalidatePath } from "next/cache";

async function persistPost(title: string) {
  return { id: "post-1", title };
}

export async function createPost(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim();

  if (!title) {
    return { error: "标题不能为空" };
  }

  await persistPost(title);
  revalidatePath("/posts");
  return { ok: true };
}
```

更多流式与缓存模式见 [advanced.md](advanced.md)。

## 检查清单

- [ ] 当前组件是否真的需要 `'use client'`，还是可以留在服务端？
- [ ] Server Component 是否直接使用了浏览器 API 或客户端 Hook？
- [ ] 数据获取是否已经并行化，避免无意义串行等待？
- [ ] 传给 Client Component 的 props 是否可序列化且足够小？
- [ ] Server Action 是否包含鉴权、输入校验和重验证逻辑？
- [ ] 是否避免了“Server Component 调自己 API route”这种额外 hop？

## 反模式

- 为了“统一”而把整个页面都标记成 `'use client'`。
- 在 Server Component 里写 `useState`、`useEffect`、`onClick`。
- 服务端明明能直连数据库，却还 `fetch("/api/...")` 绕一跳。
- 把数据库实体、函数、日期对象树、敏感 token 直接传给客户端组件。
- Server Action 里不做鉴权和校验，只把表单数据原样写库。
