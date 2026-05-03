---
title: 延迟 await 到需要时
impact: HIGH
impactDescription: 避免阻塞未使用的代码路径
tags: async, await, conditional, optimization
---

## 延迟 await 到需要时

将 `await` 操作移到实际使用它的分支内，避免阻塞不需要该结果的代码路径。

**错误（阻塞两个分支）：**

```typescript
async function handleRequest(userId: string, skipProcessing: boolean) {
  const userData = await fetchUserData(userId)

  if (skipProcessing) {
    // 直接返回但仍等待了 userData
    return { skipped: true }
  }

  // 只有这个分支使用 userData
  return processUserData(userData)
}
```

**正确（仅在需要时阻塞）：**

```typescript
async function handleRequest(userId: string, skipProcessing: boolean) {
  if (skipProcessing) {
    // 直接返回，不等待
    return { skipped: true }
  }

  // 仅在需要时获取
  const userData = await fetchUserData(userId)
  return processUserData(userData)
}
```

**另一个例子（提前返回优化）：**

```typescript
// 错误：始终获取权限
async function updateResource(resourceId: string, userId: string) {
  const permissions = await fetchPermissions(userId)
  const resource = await getResource(resourceId)

  if (!resource) {
    return { error: 'Not found' }
  }

  if (!permissions.canEdit) {
    return { error: 'Forbidden' }
  }

  return await updateResourceData(resource, permissions)
}

// 正确：仅在需要时获取
async function updateResource(resourceId: string, userId: string) {
  const resource = await getResource(resourceId)

  if (!resource) {
    return { error: 'Not found' }
  }

  const permissions = await fetchPermissions(userId)

  if (!permissions.canEdit) {
    return { error: 'Forbidden' }
  }

  return await updateResourceData(resource, permissions)
}
```

当跳过的分支经常被执行，或被延迟的操作代价很高时，此优化尤为重要。

对于 `await getFlag()` 加廉价同步守卫（`flag && someCondition`）的情况，参见[在异步标记前检查廉价条件](./async-cheap-condition-before-await.md)。
