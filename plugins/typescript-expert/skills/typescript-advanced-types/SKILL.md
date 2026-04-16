---
name: typescript-advanced-types
description: 当你需要实现复杂泛型、条件类型、映射类型、模板字面量类型，或为库/API 设计稳定的类型工具时使用。目标是把“类型能表达什么”落实为可维护的工程模式。
---

# TypeScript 高级类型

## 适用场景

- 需要给公共函数、组件或 SDK 设计可复用的泛型 API。
- 需要把“输入不同，返回值也不同”的规则编码进类型系统，而不是靠注释说明。
- 需要把对象结构批量转换成只读、可选、事件处理器、字段路径等派生类型。
- 需要在复杂类型逻辑和业务可读性之间做取舍时，配合 [typescript-magician](../typescript-magician/SKILL.md) 一起收敛。
- 需要把高级类型放到真实边界里落地时，参考 [offensive-typesafety](../offensive-typesafety/SKILL.md)。

## 核心约束

- 高级类型只能服务于真实约束；如果普通对象类型已经够用，不要为了“炫技”引入条件分发。
- 先让运行时代码直白，再把重复约束提炼进类型工具；不要先写 30 行类型体操再补业务逻辑。
- 所有泛型参数都要有清晰语义和最小必要约束，避免裸 `T, U, V` 无限扩散。
- 映射类型与模板字面量要优先复用现成键名；不要手工维护第二套字符串联合类型。
- 类型工具一旦服务于公共接口，就要配合示例或类型测试验证推导结果不会回退成 `any` / `unknown`。

## 代码模式

### 1. 用泛型和 `keyof` 精准约束属性访问

```ts
function getProperty<T extends object, K extends keyof T>(value: T, key: K): T[K] {
  return value[key];
}

const user = { id: 1, profile: { name: "Ada" } };
const profile = getProperty(user, "profile");

if (profile.name !== "Ada") {
  throw new Error("generic property access drift");
}
```

### 2. 用条件类型抽取异步返回值，而不是手工同步两套类型

```ts
type AsyncValue<T> = T extends Promise<infer Result> ? Result : T;

async function fetchUser() {
  return { id: 1, name: "Ada" };
}

type User = AsyncValue<ReturnType<typeof fetchUser>>;

const sampleUser: User = {
  id: 1,
  name: "Ada",
};

if (sampleUser.id !== 1) {
  throw new Error("conditional type drift");
}
```

### 3. 用映射类型和模板字面量批量生成稳定 API

```ts
type Events = {
  created: { id: string };
  archived: { id: string; reason: string };
};

type EventHandlers<T extends Record<string, object>> = {
  [K in keyof T as `on${Capitalize<string & K>}`]: (payload: T[K]) => string;
};

const handlers: EventHandlers<Events> = {
  onCreated: ({ id }) => id,
  onArchived: ({ reason }) => reason,
};

if (handlers.onArchived({ id: "evt-1", reason: "done" }) !== "done") {
  throw new Error("mapped type drift");
}
```

### 4. 用递归模板字面量表达字段路径

```ts
type DotPath<T> = T extends object
  ? {
      [K in keyof T & string]:
        T[K] extends object
          ? K | `${K}.${DotPath<T[K]>}`
          : K;
    }[keyof T & string]
  : never;

type Config = {
  server: {
    host: string;
    port: number;
  };
  features: {
    billing: {
      enabled: boolean;
    };
  };
};

const selectedPath: DotPath<Config> = "features.billing.enabled";
if (selectedPath !== "features.billing.enabled") {
  throw new Error("template literal type drift");
}
```

## 检查清单

- 泛型参数是否有清晰职责和必要约束，而不是无意义的 `T extends any`？
- 条件类型是否真的在消除重复分支，而不是把简单逻辑藏进类型黑盒？
- 映射类型是否复用了现有键名来源，避免手写第二份字符串联合？
- 模板字面量类型是否服务于真实 API（事件名、字段路径、缓存 key），而不是展示技巧？
- 是否为公共类型工具补了示例、类型断言或最小使用样例，防止后续改动把推导结果降级成 `any`？

## 反模式

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

### FAIL: 手工维护字符串联合

```ts
type FieldName = “userId” | “userName” | “userEmail” | “orderId”;
// 加字段要同步两处
```

### PASS: 从对象推导

```ts
const user = { userId: '', userName: '' } as const;
type FieldName = keyof typeof user;
// 改对象自动同步
```

### FAIL: 公共 API 暴露过多泛型

```ts
function query<T extends Schema, K extends keyof T, V extends T[K], R = V>(
  schema: T, key: K, value: V): Promise<R>
// 调用：query<UserSchema, 'id', string, User>(...)
```

### PASS: 推导优先

```ts
function query<T extends Schema>(schema: T, key: keyof T, value: T[keyof T]): Promise<T[keyof T]>
// 调用：query(userSchema, 'id', '123')  自动推导
```
