---
name: utility-types
description: TypeScript 内置工具类型，用于类型变换
metadata:
  tags: utility-types, parameters, returntype, awaited, omit, partial, record
---

# TypeScript 工具类型

## 概述

TypeScript 提供了内置的工具类型，用于常见的类型变换。掌握这些工具是高级 TypeScript 编程的基础。

## Parameters<T>

将函数类型的参数类型提取为元组：

```typescript
function fetchUser(id: string, opts?: { timeout?: number }): Promise<User> {
  // ...
}

type FetchUserParams = Parameters<typeof fetchUser>;
// 类型：[id: string, opts?: { timeout?: number } | undefined]

// 用于包装函数
const fetchUserWithLogging = async (
  ...args: Parameters<typeof fetchUser>
): Promise<User> => {
  console.log("Fetching user:", args[0]);
  return fetchUser(...args);
};
```

## ReturnType<T>

提取函数类型的返回值类型：

```typescript
function createUser(name: string, email: string) {
  return {
    id: crypto.randomUUID(),
    name,
    email,
    createdAt: new Date(),
  };
}

type User = ReturnType<typeof createUser>;
// 类型：{ id: string; name: string; email: string; createdAt: Date }
```

## Awaited<T>

解包 Promise 内部的类型（包括嵌套 Promise）：

```typescript
type PromiseString = Promise<string>;
type NestedPromise = Promise<Promise<number>>;

type Unwrapped1 = Awaited<PromiseString>; // string
type Unwrapped2 = Awaited<NestedPromise>; // number

// 与 ReturnType 结合用于异步函数
async function fetchUser(id: string): Promise<User> {
  // ...
}

type FetchUserResult = Awaited<ReturnType<typeof fetchUser>>;
// 类型：User（不是 Promise<User>）
```

## 模式：包装外部库函数

当扩展未导出类型的外部库函数时：

```typescript
import { fetchUser } from "external-lib";

// 提取并扩展返回类型
type FetchUserReturn = Awaited<ReturnType<typeof fetchUser>>;

export const fetchUserWithFullName = async (
  ...args: Parameters<typeof fetchUser>
): Promise<FetchUserReturn & { fullName: string }> => {
  const user = await fetchUser(...args);
  return {
    ...user,
    fullName: `${user.firstName} ${user.lastName}`,
  };
};
```

## Record<Keys, Type>

创建具有指定键和值类型的对象类型：

```typescript
type Role = "admin" | "user" | "guest";
type Permissions = Record<Role, string[]>;

const rolePermissions: Permissions = {
  admin: ["read", "write", "delete"],
  user: ["read", "write"],
  guest: ["read"],
};

// 带约束的动态键
function createLookup<K extends string, V>(
  keys: K[],
  getValue: (key: K) => V
): Record<K, V> {
  const result = {} as Record<K, V>;
  for (const key of keys) {
    result[key] = getValue(key);
  }
  return result;
}
```

## Partial<T>

将所有属性变为可选：

```typescript
interface User {
  id: string;
  name: string;
  email: string;
}

type UpdateUserInput = Partial<User>;
// 类型：{ id?: string; name?: string; email?: string }

function updateUser(id: string, updates: Partial<User>): User {
  // ...
}

updateUser("123", { name: "New Name" }); // 正确 - 仅更新 name
```

## Required<T>

将所有属性变为必需（与 Partial 相反）：

```typescript
interface Config {
  host?: string;
  port?: number;
  debug?: boolean;
}

type RequiredConfig = Required<Config>;
// 类型：{ host: string; port: number; debug: boolean }
```

## Omit<T, Keys>

通过省略指定属性创建新类型：

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
}

type PublicUser = Omit<User, "password">;
// 类型：{ id: string; name: string; email: string }

type CreateUserInput = Omit<User, "id">;
// 类型：{ name: string; email: string; password: string }
```

## Pick<T, Keys>

通过选取指定属性创建新类型（与 Omit 相反）：

```typescript
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
}

type UserCredentials = Pick<User, "email" | "password">;
// 类型：{ email: string; password: string }
```

## Exclude<T, U> 和 Extract<T, U>

操作联合类型：

```typescript
type AllColors = "red" | "green" | "blue" | "yellow";

type PrimaryColors = Extract<AllColors, "red" | "blue">;
// 类型："red" | "blue"

type NonPrimaryColors = Exclude<AllColors, "red" | "blue">;
// 类型："green" | "yellow"
```

## NonNullable<T>

从类型中移除 null 和 undefined：

```typescript
type MaybeString = string | null | undefined;
type DefiniteString = NonNullable<MaybeString>;
// 类型：string
```

## 创建可复用的包装类型

组合工具类型创建可复用的类型辅助：

```typescript
// 包装任意异步函数，扩展其返回类型的类型
type WrapFunction<
  TFunc extends (...args: any) => any,
  TAdditional = {}
> = (
  ...args: Parameters<TFunc>
) => Promise<Awaited<ReturnType<TFunc>> & TAdditional>;

// 使用示例
import { fetchUser, fetchPost } from "external-lib";

const fetchUserWithMeta: WrapFunction<
  typeof fetchUser,
  { meta: { fetchedAt: Date } }
> = async (...args) => {
  const user = await fetchUser(...args);
  return {
    ...user,
    meta: { fetchedAt: new Date() },
  };
};
```

## 各工具类型的使用场景

| 工具类型 | 使用场景 |
|---------|----------|
| `Parameters<T>` | 包装函数、创建函数变体 |
| `ReturnType<T>` | 未显式导出时提取返回类型 |
| `Awaited<T>` | 解包 Promise 类型 |
| `Record<K, V>` | 创建动态键的对象类型 |
| `Partial<T>` | 更新/补丁操作 |
| `Required<T>` | 确保所有配置项都已提供 |
| `Omit<T, K>` | 移除敏感或内部字段 |
| `Pick<T, K>` | 创建聚焦的类型子集 |
| `Exclude<T, U>` | 过滤联合类型 |
| `Extract<T, U>` | 从联合类型中选取 |
| `NonNullable<T>` | 验证后移除 null/undefined |

## 常见陷阱

### 在异步函数上使用 ReturnType

```typescript
async function getData(): Promise<string[]> {
  return ["data"];
}

// 这会得到 Promise<string[]>，不是 string[]
type Wrong = ReturnType<typeof getData>; // Promise<string[]>

// 使用 Awaited 解包
type Right = Awaited<ReturnType<typeof getData>>; // string[]
```

### 忘记 typeof 用于运行时函数

```typescript
function myFunc(x: number): string {
  return String(x);
}

// 错误 - myFunc 是值，不是类型
type Params = Parameters<myFunc>; // 报错

// 正确 - 使用 typeof
type Params = Parameters<typeof myFunc>; // [x: number]
```
