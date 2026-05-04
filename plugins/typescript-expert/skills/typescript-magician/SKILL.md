---
name: typescript-magician
description: 当需要定位 TypeScript 编译错误、清理 `any`、设计复杂泛型、补齐类型守卫、设计条件类型/映射类型/模板字面量类型，或收敛工具类型时使用。
---

# TypeScript 类型魔法师

## 适用场景

- `tsc --noEmit` 或编辑器诊断里出现类型错误，需要定位真正的类型断点。
- 旧代码里充满 `any`、弱类型字典、隐式索引访问，想逐步替换成严格边界。
- 需要设计可推导的泛型函数、类型守卫、条件类型、映射类型、模板字面量类型或工具类型。
- 需要把“输入不同，返回值也不同”的规则编码进类型系统，而不是靠注释说明。
- 遇到系统级类型合同时联动 [offensive-typesafety](../offensive-typesafety/SKILL.md)。

## 核心约束

- 先跑 `tsc --noEmit` 再改代码；没有报错上下文就不要盲改类型。
- `any` 优先用 `unknown` + 类型守卫、泛型约束或判别联合收口，不要换成另一个宽松断言。
- 先修上游合同，再修下游症状。不要用断言把真正的错误压过去。
- 高级类型只能服务于真实约束；普通对象类型已经够用时不要引入条件分发。
- 所有泛型参数都要有清晰语义和最小必要约束。
- 类型工具一旦服务于公共接口，就要配合示例验证推导结果不会回退成 `any`/`unknown`。
- 优先加载这些参考文件：
  - [advanced-patterns.md](references/advanced-patterns.md) — 条件类型、映射类型、模板字面量、递归字段路径完整代码
  - [as-const-typeof](rules/as-const-typeof.md)、[generics-basics](rules/generics-basics.md)、[conditional-types](rules/conditional-types.md)、[infer-keyword](rules/infer-keyword.md)、[template-literal-types](rules/template-literal-types.md)、[mapped-types](rules/mapped-types.md)、[type-narrowing](rules/type-narrowing.md)、[error-diagnosis](rules/error-diagnosis.md)

## 代码模式

### 用泛型替换 `any` 工具函数

```ts
function getProperty<T extends object, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
const project = { name: "ai-experts", stars: 12 };
const stars = getProperty(project, "stars");
```

### 用 `unknown` + 类型守卫收口外部输入

```ts
type User = { id: number; name: string };
function isUser(value: unknown): value is User {
  return typeof value === "object" && value !== null && "id" in value && "name" in value;
}
function normalizeUser(value: unknown): User {
  if (!isUser(value)) throw new Error("Invalid user shape");
  return value;
}
```

### 用判别联合和穷尽校验定位遗漏分支

```ts
type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: string[] }
  | { status: "error"; message: string };

function summarize(state: LoadState): string {
  switch (state.status) {
    case "idle": return "idle";
    case "loading": return "loading";
    case "success": return `${state.data.length} items`;
    case "error": return state.message;
    default: { const _exhaustive: never = state; return _exhaustive; }
  }
}
```

条件类型（`infer`）、映射类型（`as` 键重映射 + `Capitalize`）、模板字面量递归字段路径等完整代码见 [references/advanced-patterns.md](references/advanced-patterns.md)。

## 检查清单

- 是否先拿到完整错误输出，再决定改哪一层类型？
- `any` 是否缩回了边界层，而不是简单替换成新的宽松断言？
- 泛型参数是否有清晰职责和必要约束？
- 条件类型是否真的在消除重复，还是把简单逻辑藏进类型黑盒？
- 是否为公共类型工具补了最小使用样例？
- 是否让命名反映类型意图，而不是把复杂性藏进匿名条件类型？

## 反模式

### FAIL: 用断言掩盖合同不一致

```ts
const user = fetchUser() as User; // fetchUser 返回 unknown，as 只骗编译器
```

### PASS: 用类型守卫收口

```ts
const raw = fetchUser();
if (!isUser(raw)) throw new Error("invalid user shape");
// raw 现在是 User，编译器+运行时双重保证
```

### FAIL: 类型体操替代普通对象

```ts
type EventPayload<E extends string, T extends Record<string, unknown>> =
  E extends keyof T ? T[E] extends infer P ? P extends object ? P : never : never : never;
// 调用方不知道这能推出什么
```

### PASS: 直白对象映射

```ts
type Events = { userCreated: { id: string }; userArchived: { id: string; reason: string } };
type EventPayload<E extends keyof Events> = Events[E];
```

### FAIL: 公共 API 暴露过多泛型

```ts
function query<T extends Schema, K extends keyof T, V extends T[K], R = V>(...): Promise<R>
// 调用：query<UserSchema, 'id', string, User>(...) — 4 个泛型参数全需手写
```

### PASS: 推导优先

```ts
function query<T extends Schema>(schema: T, key: keyof T, value: T[keyof T]): Promise<T[keyof T]>
// 调用：query(userSchema, 'id', '123') — 自动推导
```

### FAIL: schema 漂移 → 前端加可选链兜底

```ts
const name = response?.data?.user?.profile?.displayName ?? "Unknown";
// 真正的问题在 API 合同漂移，加 ?. 只是推迟崩溃
```

### PASS: 修上游合同

```ts
const name = response.data.user.displayName;
// API schema 更新 → 类型重新生成 → tsc 自动暴露所有断点
```
