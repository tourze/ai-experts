---
name: array-index-access
description: 使用 number 索引访问数组元素类型
metadata:
  tags: arrays, tuples, indexed-access, number-index
---

# 使用 `[number]` 进行数组索引访问

## 概述

在 TypeScript 中，可以使用索引访问类型来访问数组元素类型。`[number]` 语法特别强大，可以从数组或元组中提取所有可能元素类型的联合。

## 基本概念

就像可以用字符串键访问对象属性一样，可以用数字索引访问数组元素：

```typescript
const roles = ["user", "admin", "anonymous"] as const;

// 访问特定索引
type FirstRole = typeof roles[0]; // "user"
type SecondRole = typeof roles[1]; // "admin"

// 用 [number] 访问所有元素
type AnyRole = typeof roles[number]; // "user" | "admin" | "anonymous"
```

## `[number]` 的原理

`number` 类型作为索引时，代表所有可能数字索引的联合。TypeScript 将其作为访问所有元素的快捷方式：

```typescript
// 概念上等价于：
type AnyRole = typeof roles[0 | 1 | 2];
// 但 [number] 自动处理任意数组长度
```

## 模式：提取数组元素类型

```typescript
const userAccessModel = {
  user: ["update-self", "view"],
  admin: ["create", "update-self", "update-any", "delete", "view"],
  anonymous: ["view"],
} as const;

type Role = keyof typeof userAccessModel;
// 类型："user" | "admin" | "anonymous"

// 获取所有值（数组）作为联合类型
type UserAccessModelValues = typeof userAccessModel[Role];
// 类型：readonly ["update-self", "view"] | readonly ["create", ...] | readonly ["view"]

// 从所有角色获取所有操作
type Action = typeof userAccessModel[Role][number];
// 类型："update-self" | "view" | "create" | "update-any" | "delete"
```

## 元组与数组访问的区别

```typescript
// 元组 - 固定长度，每个位置有特定类型
const tuple = ["hello", 42, true] as const;
type TupleElements = typeof tuple[number]; // "hello" | 42 | true

// 数组 - 可变长度，单一元素类型
const array: string[] = ["a", "b", "c"];
type ArrayElement = typeof array[number]; // string
```

## 模式：提取函数参数类型

结合 `Parameters<>`，可以获取所有参数类型的联合：

```typescript
const funcWithManyParameters = (
  a: string,
  b: string,
  c: number,
  d: boolean,
) => {
  return [a, b, c, d].join(" ");
};

// 获取所有参数类型的元组
type ParamsTuple = Parameters<typeof funcWithManyParameters>;
// 类型：[string, string, number, boolean]

// 获取所有参数类型的联合
type ParamsUnion = Parameters<typeof funcWithManyParameters>[number];
// 类型：string | number | boolean
```

## 何时使用此模式

- **基于角色的访问控制**：提取所有可能的操作/权限
- **配置验证**：获取所有可能的配置值
- **事件系统**：从数组中提取所有可能的事件类型
- **表单字段**：从字段数组获取所有字段名

## 实际示例：类型安全的访问控制

```typescript
const userAccessModel = {
  user: ["update-self", "view"],
  admin: ["create", "update-self", "update-any", "delete", "view"],
  anonymous: ["view"],
} as const;

type Role = keyof typeof userAccessModel;
type Action = typeof userAccessModel[Role][number];

const canUserAccess = (role: Role, action: Action): boolean => {
  // 需要断言，因为 TypeScript 无法缩窄数组类型
  return (userAccessModel[role] as ReadonlyArray<Action>).includes(action);
};

// 类型安全的使用
canUserAccess("admin", "delete"); // 正确
canUserAccess("user", "delete"); // 编译时正确，运行时返回 false
canUserAccess("admin", "invalid"); // 报错："invalid" 不可赋值给 Action
```

## 常见陷阱

### 忘记在数组上使用 `as const`

```typescript
// 错误 - 元素被放宽为 string
const actions = ["view", "edit", "delete"];
type Action = typeof actions[number]; // string

// 正确 - 保留字面量类型
const actions = ["view", "edit", "delete"] as const;
type Action = typeof actions[number]; // "view" | "edit" | "delete"
```

### ReadonlyArray 类型不匹配

在 readonly 数组上使用 `.includes()` 时，可能需要断言：

```typescript
const items = ["a", "b", "c"] as const;
type Item = typeof items[number];

// 报错：类型 'string' 的参数不可赋值给类型 '"a" | "b" | "c"' 的参数
const hasItem = items.includes(someString);

// 解决方案：断言数组
const hasItem = (items as ReadonlyArray<Item>).includes(value as Item);
```

## 高级：条件访问

可以将 `[number]` 与条件类型结合：

```typescript
type ExtractArrayElements<T> = T extends readonly (infer U)[] ? U : never;

const permissions = ["read", "write", "admin"] as const;
type Permission = ExtractArrayElements<typeof permissions>;
// 类型："read" | "write" | "admin"
```
