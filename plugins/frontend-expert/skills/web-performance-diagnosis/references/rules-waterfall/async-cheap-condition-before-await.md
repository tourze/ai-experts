---
title: 在异步标记前检查廉价条件
impact: HIGH
impactDescription: 同步守卫已失败时避免不必要的异步工作
tags: async, await, feature-flags, short-circuit, conditional
---

## 在异步标记前检查廉价条件

当分支既需要 `await` 一个标记或远程值，又需要**廉价的同步**条件（本地 props、请求元数据、已加载状态）时，**先**评估廉价条件。否则即使组合条件永远不可能为真，也要付出异步调用成本。

这是[延迟 await 到需要时](./async-defer-await.md)在 `flag && cheapCondition` 模式上的特化。

**错误：**

```typescript
const someFlag = await getFlag()

if (someFlag && someCondition) {
  // ...
}
```

**正确：**

```typescript
if (someCondition) {
  const someFlag = await getFlag()
  if (someFlag) {
    // ...
  }
}
```

当 `getFlag` 涉及网络请求、特性标记服务或 `React.cache` / 数据库查询时，在 `someCondition` 为 false 时跳过它可以消除冷路径的额外开销。

如果 `someCondition` 本身代价高、依赖于标记，或必须按固定顺序执行副作用，则保持原顺序。
