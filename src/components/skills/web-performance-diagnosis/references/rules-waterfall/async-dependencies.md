---
title: 基于依赖的并行化
impact: CRITICAL
impactDescription: 2-10× 提升
tags: async, parallelization, dependencies, better-all
---

## 基于依赖的并行化

对于具有部分依赖的操作，使用 `better-all` 最大化并行度。它会在最早可能的时机自动启动每个任务。

**错误（profile 不必要地等待 config）：**

```typescript
const [user, config] = await Promise.all([
  fetchUser(),
  fetchConfig()
])
const profile = await fetchProfile(user.id)
```

**正确（config 和 profile 并行执行）：**

```typescript
import { all } from 'better-all'

const { user, config, profile } = await all({
  async user() { return fetchUser() },
  async config() { return fetchConfig() },
  async profile() {
    return fetchProfile((await this.$.user).id)
  }
})
```

**不引入额外依赖的替代方案：**

也可以先创建所有 Promise，最后统一 `Promise.all()`。

```typescript
const userPromise = fetchUser()
const profilePromise = userPromise.then(user => fetchProfile(user.id))

const [user, config, profile] = await Promise.all([
  userPromise,
  fetchConfig(),
  profilePromise
])
```

参考：[https://github.com/shuding/better-all](https://github.com/shuding/better-all)
