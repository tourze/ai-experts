---
name: modern-javascript-patterns
description: 使用现代 JavaScript（ES6+）特性与常见模式编写可维护代码，覆盖 async/await、destructuring、spread、modules、iterators、generators 与数据转换流程。
---

# 现代 JavaScript 模式

## 适用场景

- 需要把旧式回调、共享可变状态或冗长工具函数重构为现代 ES6+ 写法。
- 需要在业务代码和测试代码之间复用一致的数据变换模式时，联动 [javascript-typescript-jest](../javascript-typescript-jest/SKILL.md)。
- 涉及复杂状态或 Hook 边界时，优先确认 [react-hooks](../../../react-expert/skills/react-hooks/SKILL.md) 的约束。
- 需要更完整的函数式、模块化与高级语法补充材料时，再展开 [advanced-patterns.md](references/advanced-patterns.md)。
- 涉及复杂类型推导、API 合同收敛或 `any` 清理时，转到 [typescript-magician](../../../typescript-expert/skills/typescript-magician/SKILL.md)。

## 核心约束

- 优先用小而直白的语法升级：`const` / `let`、解构、可选链、空值合并、`async/await`。
- 数据转换默认保持不可变；只有性能或外部 API 明确要求时才原地修改。
- Promise 链最多一层；超过一层时改写为命名函数加 `async/await`。
- 模块边界只导出稳定 API，不暴露中间辅助函数与临时状态。
- 只有在团队已有约定或性能证据明确时才引入函数式管道、生成器等高级抽象。

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

- 为了一行代码更短，把正常分支压缩成难读的三元或逗号表达式。
- 在 `map` / `reduce` 中偷偷修改外部变量或入参。
- 把 `Promise.all` 用在互相依赖的异步步骤上。
- 为简单逻辑引入自制 `compose` / `curry` 工具，导致调试栈更难读。
- 在 CommonJS / ESM 边界混用默认导出与具名导出而不做兼容说明。
