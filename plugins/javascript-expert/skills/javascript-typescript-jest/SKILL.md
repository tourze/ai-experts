---
name: javascript-typescript-jest
description: 使用 Jest 为 JavaScript/TypeScript 编写可靠测试，覆盖 mocking、异步测试、test structure、常见断言与 React Testing Library 协作方式。
---

# Jest 测试模式

## 适用场景

- 需要为 JavaScript / TypeScript 模块补单元测试或轻量集成测试。
- 写测试前需要先把生产代码整理为更易测试的现代写法时，先参考 [modern-javascript-patterns](../modern-javascript-patterns/SKILL.md)。
- 组件测试涉及 Hook 行为时，对照 [react-hooks](../../../react-expert/skills/react-hooks/SKILL.md)；涉及复杂类型推断时，对照 [typescript-magician](../../../typescript-expert/skills/typescript-magician/SKILL.md)。
- 已有 React Testing Library 栈时，沿用项目既有 `render` / `screen` / `userEvent` 封装，不要另起一套 helper。

## 核心约束

- 测试名必须描述行为和结果，不写“works”“case 1”这类无信息标题。
- Mock 只替换外部边界：I/O、网络、时钟、随机数、环境变量；不要 mock 被测核心逻辑。
- 异步测试必须显式 `await`、`return` 或使用 `resolves` / `rejects`；禁止依赖隐式完成。
- 快照只用于稳定结构；一旦快照变化，需要同步解释为什么行为仍正确。
- 组件测试默认按可访问性语义查询元素，而不是依赖实现细节 `className`。

## 代码模式

### 1. 先把行为写清楚

```javascript
import { describe, expect, it } from "@jest/globals";

function sum(a, b) {
  return a + b;
}

describe("sum", () => {
  it("returns the total of two numbers", () => {
    expect(sum(1, 2)).toBe(3);
  });
});
```

### 2. 用显式 mock 控制外部边界

```javascript
import { describe, expect, it, jest } from "@jest/globals";

async function loadName(api, userId) {
  const user = await api.getUser(userId);
  return user.name;
}

describe("loadName", () => {
  it("reads the user name from api", async () => {
    const api = { getUser: jest.fn().mockResolvedValue({ name: "Alice" }) };

    await expect(loadName(api, 7)).resolves.toBe("Alice");
    expect(api.getUser).toHaveBeenCalledWith(7);
  });
});
```

### 3. 用 beforeEach 收敛共享前置状态

```javascript
import { beforeEach, describe, expect, it } from "@jest/globals";

let cart;

beforeEach(() => {
  cart = [];
});

describe("cart", () => {
  it("starts empty for each test", () => {
    expect(cart).toHaveLength(0);
  });
});
```

## 检查清单

- 测试是否只验证一个行为失败原因；失败时能否从标题直接看出影响范围。
- 是否覆盖成功路径、失败路径和边界输入，而不只测 happy path。
- 是否只对外部依赖做 mock，并在 `afterEach` / `beforeEach` 清理共享状态。
- 是否对 Promise 使用 `await expect(...).rejects` 或 `await expect(...).resolves`。
- 组件测试是否优先 `getByRole`、`getByLabelText`、`findByText` 等面向用户的查询。
- 如果测试脆弱到依赖太多 mock，是否应该先回到 [modern-javascript-patterns](../modern-javascript-patterns/SKILL.md) 重构生产代码。

## 反模式

- 通过 `setTimeout` 或手动 `done()` 掩盖异步竞态。
- 为了让测试通过，把每个函数都 `jest.mock()` 掉，结果没有覆盖真实行为。
- 把大对象直接做快照而不拆分断言，导致 diff 无法阅读。
- 断言数量过多却不分场景，单个失败会隐藏真正原因。
- 组件测试只查 class / id，导致重构样式时测试大量误报。
