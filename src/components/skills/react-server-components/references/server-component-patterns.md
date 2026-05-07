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

更多流式与缓存模式见 [advanced](advanced.md)。

优化规则索引（请求级去重、并行获取、缓存、序列化、Server Actions 安全等）见 [rules/](rules/) 目录。
