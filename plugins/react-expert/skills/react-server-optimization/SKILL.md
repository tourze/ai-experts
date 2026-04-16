---
name: react-server-optimization
description: 当需要优化 React Server Components 的数据获取、缓存、序列化或 Server Actions 安全性时使用。用户提到 RSC 性能、Server Action 认证、React.cache、服务端瀑布、序列化开销 时触发。
---

# React 服务端优化

## 适用场景

- Server Components 存在串行数据获取，需要并行化。
- Server Actions 缺少认证/授权检查，存在安全风险。
- RSC 边界传递了过多 props，导致序列化开销过大。
- 需要在服务端做请求级去重（React.cache）或跨请求缓存（LRU）。
- RSC 基础概念可联动 [react-server-components](../react-server-components/SKILL.md)。
- 这套 skill 是规则索引；需要细节时直接打开对应 `rules/*.md` 文件。

## 核心约束

- Server Actions 必须在函数体内做认证/授权检查，不能依赖 middleware 或页面级守卫。
- 服务端模块不能存放请求相关的可变状态，会造成跨请求污染。
- React.cache() 只做请求级去重，跨请求缓存用 LRU 或外部缓存。
- RSC props 只传最小必要数据，避免把整个数据库对象序列化到客户端。

## 代码模式

```typescript
// FAIL — Server Action 没有认证
'use server';

export async function deleteUser(userId: string) {
  await db.user.delete({ where: { id: userId } });
}
```

```typescript
// PASS — Server Action 内部认证 + 授权
'use server';

import { verifySession } from '@/lib/auth';

export async function deleteUser(userId: string) {
  const session = await verifySession();
  if (!session || session.user.role !== 'admin') {
    throw new Error('Unauthorized');
  }
  await db.user.delete({ where: { id: userId } });
}
```

```typescript
// PASS — React.cache 做请求级去重
import { cache } from 'react';

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  return session?.user;
});
```

```md
规则文件索引：
- [rules/server-auth-actions.md](rules/server-auth-actions.md)
- [rules/server-parallel-fetching.md](rules/server-parallel-fetching.md)
- [rules/server-parallel-nested-fetching.md](rules/server-parallel-nested-fetching.md)
- [rules/server-cache-react.md](rules/server-cache-react.md)
- [rules/server-cache-lru.md](rules/server-cache-lru.md)
- [rules/server-serialization.md](rules/server-serialization.md)
- [rules/server-dedup-props.md](rules/server-dedup-props.md)
- [rules/server-no-shared-module-state.md](rules/server-no-shared-module-state.md)
- [rules/server-hoist-static-io.md](rules/server-hoist-static-io.md)
- [rules/server-after-nonblocking.md](rules/server-after-nonblocking.md)
```

## 检查清单

- [ ] 所有 Server Actions 是否在函数体内做了认证和授权？
- [ ] 服务端模块是否避免了请求级可变状态？
- [ ] 同一请求内的重复数据获取是否用 React.cache() 去重？
- [ ] RSC props 是否只传递了渲染所需的最小数据？
- [ ] 嵌套 Server Components 的数据获取是否做了并行化？
- [ ] 非阻塞操作（日志、分析）是否用 after() 延迟执行？

## 反模式

- Server Action 只靠 middleware 鉴权，直接调用时绕过检查。
- 在服务端模块顶层用 `let currentUser = ...` 存请求数据，多请求共享导致数据串台。
- 把完整数据库行对象作为 RSC props 传给客户端组件。
- 父子 Server Components 各自独立 fetch 同一数据，未做去重。
