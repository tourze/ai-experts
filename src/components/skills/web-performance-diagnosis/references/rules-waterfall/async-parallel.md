---
title: Promise.all() 并行化无依赖操作
impact: CRITICAL
impactDescription: 2-10× 提升
tags: async, parallelization, promises, waterfalls
---

## Promise.all() 并行化无依赖操作

当异步操作之间没有相互依赖时，使用 `Promise.all()` 并发执行。

**错误（顺序执行，3 次往返）：**

```typescript
const user = await fetchUser()
const posts = await fetchPosts()
const comments = await fetchComments()
```

**正确（并行执行，1 次往返）：**

```typescript
const [user, posts, comments] = await Promise.all([
  fetchUser(),
  fetchPosts(),
  fetchComments()
])
```
