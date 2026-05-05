## 代码模式

```tsx
// app/users/page.tsx
async function fetchUsers() {
  return [{ id: “1”, name: “Ada” }];
}

async function fetchTeams() {
  return [{ id: “team-1”, name: “Platform” }];
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

优化规则索引（请求级去重、并行获取、缓存、序列化、Server Actions 安全等）见 [rules/](rules/) 目录。

## 反模式

### FAIL: 整页 'use client'

```tsx
“use client”;  // 整页变 SPA
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
  const products = await db.query(“SELECT * FROM products”);
  return <ProductList products={products} />;
}

// FilterControls.tsx (Client)
“use client”;
export function FilterControls({ onChange }) {
  const [selected, setSelected] = useState();
  // 仅交互部分需要 client
}
```

Server Action 认证、模块级状态污染、整 row 序列化、React.cache 去重等优化反模式见 [references/advanced-patterns.md](references/advanced-patterns.md)。
