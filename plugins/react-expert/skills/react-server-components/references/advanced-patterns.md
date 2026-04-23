# React Server Components 进阶模式

本文件是 React Server Components SKILL.md 的拆分内容，包含 Client Component、Server Action 及进阶反模式的完整代码。

## Client Component 边界

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

## Server Action

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

## 反模式

### FAIL: 服务端绕 API route

```tsx
// app/users/page.tsx (Server)
export default async function UsersPage() {
  const res = await fetch("http://localhost:3000/api/users"); // 多一跳
  const users = await res.json();
  return <List users={users} />;
}
```

### PASS: 直连数据库

```tsx
import { db } from "@/lib/db";
export default async function UsersPage() {
  const users = await db.user.findMany();  // 0 hop
  return <List users={users} />;
}
```

### FAIL: Server Action 无鉴权

```tsx
"use server";
export async function deletePost(formData: FormData) {
  const id = formData.get("id");
  await db.post.delete({ where: { id } });  // 任何人都能删任意 post
}
```

### PASS: 鉴权 + 校验 + 重验证

```tsx
"use server";
export async function deletePost(formData: FormData) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const id = z.string().uuid().parse(formData.get("id"));
  const post = await db.post.findUnique({ where: { id } });
  if (post.authorId !== session.userId) throw new Error("Forbidden");

  await db.post.delete({ where: { id } });
  revalidatePath("/posts");
}
```
