## 代码模式

### 1. 用解构与展开保持更新清晰

```javascript
function normalizeUser(user) {
  const { name, email, ...rest } = user;
  return {
    ...rest,
    name: name.trim(),
    email: email.toLowerCase(),
  };
}
```

### 2. 用 async/await 把错误处理收口

```javascript
async function loadProfile(api, userId) {
  try {
    const user = await api.getUser(userId);
    const orders = await api.getOrders(user.id);
    return { user, orders };
  } catch (error) {
    throw new Error("loadProfile failed", { cause: error });
  }
}
```

### 3. 用小型纯函数组织数据流水线

```javascript
const trimName = (user) => ({ ...user, name: user.name.trim() });
const normalizeEmail = (user) => ({ ...user, email: user.email.toLowerCase() });
const markActive = (user) => ({ ...user, active: true });

function pipe(value, ...steps) {
  return steps.reduce((current, step) => step(current), value);
}

const inputUser = { name: " Alice ", email: "ALICE@EXAMPLE.COM" };
const result = pipe(inputUser, trimName, normalizeEmail, markActive);
```

## 检查清单

- 是否消除了回调嵌套、共享可变状态和隐式 `this`。
- 是否使用 `??` 而不是会误伤 `0` / `""` / `false` 的 `||`。
- 是否把数组转换写成 `map` / `filter` / `reduce` 等可读流程，而不是副作用循环。
- 是否对异步边界补上错误语义、超时或重试策略。
- 是否让导出函数名表达业务意图，而不是暴露 `helper` / `util` / `temp`。
- 若引入高级语法，团队成员是否无需额外上下文就能读懂。

## 反模式

### FAIL: 用 || 代替 ?? 误伤合法假值

```javascript
const count = options.count || 10; // count 为 0 时变成 10！
const name = options.name || "default"; // name 为 "" 时变成 "default"！
```

### PASS: 用 ?? 只兜底 null/undefined

```javascript
const count = options.count ?? 10; // count 为 0 时保持 0
const name = options.name ?? "default"; // name 为 "" 时保持 ""
```

### FAIL: map 里偷偷修改外部状态

```javascript
const seen = {};
const unique = items.map(item => {
  seen[item.id] = true; // 副作用！map 不该修改外部变量
  return item;
});
```

### PASS: 用合适的工具做去重

```javascript
const unique = [...new Map(items.map(item => [item.id, item])).values()];
```

- 把 `Promise.all` 用在互相依赖的异步步骤上。
- 在 CommonJS / ESM 边界混用默认导出与具名导出而不做兼容说明。
