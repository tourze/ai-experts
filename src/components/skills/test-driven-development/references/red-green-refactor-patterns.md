## 代码模式

循环流程图见 [references/tdd-cycle.dot](./references/tdd-cycle.dot)。

### 模式 1：RED

```typescript
test("retries a failing operation three times", async () => {
  let attempts = 0;

  const operation = async () => {
    attempts += 1;
    if (attempts < 3) {
      throw new Error("fail");
    }
    return "success";
  };

  await expect(retryOperation(operation)).resolves.toBe("success");
  expect(attempts).toBe(3);
});
```

### 模式 2：GREEN

```typescript
async function retryOperation(fn: () => Promise<string>): Promise<string> {
  let lastError: Error | undefined;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
    }
  }

  throw lastError ?? new Error("retryOperation failed without error");
}
```

### 模式 3：REFACTOR

跑测试 → 消除重复 → 提升命名 → 抽不改行为的辅助函数。

## 纪律守卫

### Iron Law

```
没有失败测试，不写生产代码
```

### Red Flags — 出现以下念头时立即停下

| 念头 | 现实 |
|------|------|
| "先写完代码再补测试，一样的" | 不一样。先写代码 = 你在验证实现，不在验证行为。 |
| "这个太简单了，不需要先写测试" | 简单 = 测试也简单。30 秒写一个测试比你想象的快。 |
| "我手动测过了，能跑" | 手动测试不可重复、不可回归。下次改代码你还手测一遍？ |
| "测试第一次就通过了" | 这意味着你在测试已有行为，不是新行为。重新检查测试。 |

**执行前必须读取** [references/discipline-guard.md](./references/discipline-guard.md)——包含完整 Red Flags 表和 Rationalizations 对照表。跳过 = 违反 Iron Law。
