---
name: waterfall-elimination
description: 当需要消除异步请求瀑布流、并行化独立数据获取或优化 Suspense 边界时使用。用户提到 waterfall、串行请求、Promise.all、defer await、Suspense、请求链 时触发。
---

# 消除请求瀑布流

## 适用场景

- 页面或 API 存在串行数据获取，每层 await 叠加完整网络延迟。
- 需要识别独立请求并用 Promise.all 并行化。
- 需要根据数据依赖关系决定哪些请求可以并行、哪些必须串行。
- 需要在 React/Next.js 中合理放置 Suspense 边界以避免全页阻塞。
- 这套 skill 是规则索引；需要细节时直接打开对应 `rules/*.md` 文件。

## 核心约束

- 先画出数据依赖图，有真实依赖关系的请求才允许串行。
- 便宜条件（缓存命中、feature flag、权限检查）放在 await 之前，避免不必要的网络调用。
- 不要把所有 await 都塞进一个 Promise.all — 有依赖关系的仍需串行。
- Suspense 边界要包裹在独立数据源级别，而不是整个页面。

## 代码模式

```typescript
// FAIL — 串行 3 次网络请求
const user = await fetchUser();
const posts = await fetchPosts();
const comments = await fetchComments();
```

```typescript
// PASS — 并行执行，1 次网络往返
const [user, posts, comments] = await Promise.all([
  fetchUser(),
  fetchPosts(),
  fetchComments(),
]);
```

```typescript
// PASS — 有依赖关系时只串行必要的部分
const user = await fetchUser();
const [posts, followers] = await Promise.all([
  fetchPostsByUser(user.id),
  fetchFollowers(user.id),
]);
```

```md
规则文件索引：
- [rules/async-parallel.md](rules/async-parallel.md)
- [rules/async-defer-await.md](rules/async-defer-await.md)
- [rules/async-dependencies.md](rules/async-dependencies.md)
- [rules/async-cheap-condition-before-await.md](rules/async-cheap-condition-before-await.md)
- [rules/async-api-routes.md](rules/async-api-routes.md)
- [rules/async-suspense-boundaries.md](rules/async-suspense-boundaries.md)
```

## 检查清单

- [ ] 是否找出了所有无依赖关系的请求并用 Promise.all 并行化？
- [ ] 是否在 await 之前先检查了便宜的退出条件？
- [ ] 是否避免了"为安全起见全部串行"的懒惰做法？
- [ ] API route 中的多个数据库查询是否做了并行化？
- [ ] Suspense 边界是否只包裹了真正需要异步加载的子树？
- [ ] 改动前后是否有 waterfall 深度的对比？

## 反模式

### FAIL: 逐行 await 瀑布

```ts
const user = await fetchUser();        // 200ms
const posts = await fetchPosts();      // 200ms
const comments = await fetchComments();// 200ms
// 总耗时 600ms，三个请求互相不依赖
```

### PASS: Promise.all 并行

```ts
const [user, posts, comments] = await Promise.all([
  fetchUser(), fetchPosts(), fetchComments(),
]);
// 总耗时 200ms（max 而非 sum）
```

### FAIL: 在 Promise.all 混依赖

```ts
const [user, posts] = await Promise.all([
  fetchUser(),
  fetchPostsByUser(currentUser.id),  // currentUser 还没拿到
]);
```

### PASS: 仅必要部分串行

```ts
const user = await fetchUser();  // 这一步必须先
const [posts, followers] = await Promise.all([
  fetchPostsByUser(user.id),
  fetchFollowers(user.id),
]);
// 总耗时 = T(user) + max(T(posts), T(followers))
```
