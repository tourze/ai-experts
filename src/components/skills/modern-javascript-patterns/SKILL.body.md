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
