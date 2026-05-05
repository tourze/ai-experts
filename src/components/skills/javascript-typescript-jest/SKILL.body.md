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
