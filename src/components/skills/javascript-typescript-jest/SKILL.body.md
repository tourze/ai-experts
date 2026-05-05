## 联动说明

> 通用测试原则（AAA/FIRST/fixture/mock/参数化/反模式）见 [testing-patterns](testing-expert:testing-patterns)。本 skill 只覆盖 JavaScript/TypeScript 特有语法与工具。

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

- 是否在 `afterEach` / `beforeEach` 清理共享状态。
- 是否对 Promise 使用 `await expect(...).rejects` 或 `await expect(...).resolves`。
- 组件测试是否优先 `getByRole`、`getByLabelText`、`findByText` 等面向用户的查询。
- 如果测试脆弱到依赖太多 mock，是否应该先回到 [modern-javascript-patterns](../modern-javascript-patterns/SKILL.md) 重构生产代码。

## 反模式

### FAIL: setTimeout 等异步

```js
it('saves user', (done) => {
  service.save(user);
  setTimeout(() => {
    expect(db.users).toHaveLength(1);
    done();
  }, 1000);  // 慢机不够 / 快机白等
});
```

### PASS: await + resolves

```js
it('saves user', async () => {
  await service.save(user);
  expect(db.users).toHaveLength(1);
});
// 或：await expect(service.save(user)).resolves.toEqual({...});
```

### FAIL: 全 mock

```js
jest.mock('@/services/order');
jest.mock('@/services/user');
jest.mock('@/services/inventory');
// 测试通过 / 实际业务从未运行 / 假阳性
```

### PASS: 仅 mock 边界

```js
jest.mock('@/lib/stripe');  // 仅外部 API
// OrderService 和 UserService 用真实实现
// 这样测试覆盖真实业务逻辑
```

### FAIL: 查 class

```jsx
expect(container.querySelector('.btn-primary.large')).toBeInTheDocument();
// 重构 CSS class → 测试全挂
```

### PASS: 用户视角查询

```jsx
expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
// 关注用户能看到/操作什么，不关心实现细节
```
