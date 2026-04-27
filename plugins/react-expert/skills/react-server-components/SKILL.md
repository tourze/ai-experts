---
name: react-server-components
description: 当用户需要实现 RSC 架构、服务端组件边界、Server Actions、streaming 渲染、客户端组件拆分或表单提交时使用。
---

# React Server Components

## 适用场景

- 项目使用 Next.js App Router，需要在服务端组件与客户端组件之间划边界。
- 需要把数据获取、鉴权、缓存、重验证或变更动作放回服务端。
- 需要利用 `Suspense`、流式渲染和并行数据获取减少 waterfalls。
- 更完整的 Next.js 框架层约束可联动 `nextjs-developer`。
- 服务端数据获取、缓存、Server Actions 安全性可联动 [react-server-optimization](../react-server-optimization/SKILL.md)。
- 消除请求瀑布流可联动 `waterfall-elimination`。

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

Client Component 边界、Server Action 及进阶反模式的完整代码见 [references/advanced-patterns.md](references/advanced-patterns.md)。

更多流式与缓存模式见 [advanced.md](advanced.md)。

## 检查清单

- [ ] 当前组件是否真的需要 `'use client'`，还是可以留在服务端？
- [ ] Server Component 是否直接使用了浏览器 API 或客户端 Hook？
- [ ] 数据获取是否已经并行化，避免无意义串行等待？
- [ ] 传给 Client Component 的 props 是否可序列化且足够小？
- [ ] Server Action 是否包含鉴权、输入校验和重验证逻辑？
- [ ] 是否避免了“Server Component 调自己 API route”这种额外 hop？

## 反模式

### FAIL: 整页 'use client'

```tsx
"use client";  // 整页变 SPA
export default function ProductsPage() {
  const [data, setData] = useState();
  useEffect(() => { fetch('/api/products').then(...) }, []);
  return <ProductList data={data} />;
}
// 失去 SSR 优势 + 数据获取串行 + bundle 翻倍
```

### PASS: 服务端获取 + 局部交互

```tsx
// page.tsx (Server)
export default async function ProductsPage() {
  const products = await db.query("SELECT * FROM products");
  return <ProductList products={products} />;
}

// FilterControls.tsx (Client)
"use client";
export function FilterControls({ onChange }) {
  const [selected, setSelected] = useState();
  // 仅交互部分需要 client
}
```

更多反模式见 [references/advanced-patterns.md](references/advanced-patterns.md)。
