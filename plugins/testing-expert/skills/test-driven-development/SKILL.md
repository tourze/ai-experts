---
name: test-driven-development
description: 当用户要按 TDD 流程编码、先写测试再写实现、或要求红绿重构时使用。
---

# 测试驱动开发

## 适用场景

- 新功能实现。
- bug 修复与回归保护。
- 行为重构或接口改造。
- 需要把 [test-brainstorm](../test-brainstorm/SKILL.md) 里的高优先级场景落成真实测试。

## 核心约束

- 没有失败测试，不写生产代码。
- 每轮只测一个行为；测试名中出现两个 `and` 往往就该拆分。
- 必须亲眼看到测试失败，且失败原因正确。
- 绿灯阶段只写“刚好通过”的实现，不顺手加功能。
- 如果已经先写了代码，不能把它当“参考”继续补测试；要么删掉重来，要么明确承认不是 TDD。
- 写 mock 或测试工具前先看 [testing-anti-patterns.md](./testing-anti-patterns.md)。

## 代码模式

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

```bash
npm test path/to/retry.test.ts
npm test
```

重构时只允许做：

- 消除重复
- 提升命名
- 抽出不会改变行为的辅助函数

## 检查清单

- [ ] 每个行为先有失败测试
- [ ] 已确认失败原因是“功能缺失”，不是拼写或环境错误
- [ ] 实现只覆盖当前测试需要的最小能力
- [ ] 当前测试与相关回归测试都通过
- [ ] 没在绿灯阶段偷偷加需求
- [ ] 若用了 mock，确认没在测试 mock 自己

## 纪律守卫

**Iron Law：没有失败测试，不写生产代码。**

完整的 Red Flags 表和 Rationalizations 对照表见 [references/discipline-guard.md](./references/discipline-guard.md)，开始编码前必须读取。

## 反模式

- “先写完再补测试，效果一样”。
- “我已经手测过了，所以不用先写测试”。
- 失败测试一上来就通过，却继续往下写。
- 用庞大 mock 代替真实行为断言。
- 绿灯阶段顺手把未来需求也做了。
