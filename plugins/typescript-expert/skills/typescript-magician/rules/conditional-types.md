---
name: conditional-types
description: 条件类型实现类型层面的 if/else 逻辑
metadata:
  tags: conditional-types, extends, ternary, type-narrowing
---

# 条件类型

## 概述

条件类型在类型层面提供 if/else 逻辑。使用 `extends` 关键字检查类型关系，根据结果返回不同类型。

## 基本语法

```typescript
type Conditional = SomeType extends OtherType ? TrueType : FalseType;
```

条件检查 `SomeType` 是否可赋值给 `OtherType`。

## 简单示例

```typescript
// 检查类型是否为 string
type IsString<T> = T extends string ? true : false;

type Test1 = IsString<string>; // true
type Test2 = IsString<number>; // false
type Test3 = IsString<"hello">; // true（字面量 extends string）

// 检查类型关系
type Result1 = string extends string ? "yes" : "no"; // "yes"
type Result2 = string extends number ? "yes" : "no"; // "no"
type Result3 = "hello" extends string ? "yes" : "no"; // "yes"
```

## 实际示例：null 检查

```typescript
type IsNullable<T> = null extends T ? true : false;

type Test1 = IsNullable<string | null>; // true
type Test2 = IsNullable<string>; // false
type Test3 = IsNullable<undefined>; // false（null !== undefined）
```

## 条件类型与泛型

```typescript
// 根据输入返回不同类型
type TypeName<T> = T extends string
  ? "string"
  : T extends number
  ? "number"
  : T extends boolean
  ? "boolean"
  : T extends undefined
  ? "undefined"
  : T extends Function
  ? "function"
  : "object";

type T1 = TypeName<string>; // "string"
type T2 = TypeName<number>; // "number"
type T3 = TypeName<() => void>; // "function"
type T4 = TypeName<{ a: 1 }>; // "object"
```

## 联合类型的分发

当条件类型作用于联合类型时，会对每个成员分别分发：

```typescript
type ToArray<T> = T extends any ? T[] : never;

type Result = ToArray<string | number>;
// 分发为：ToArray<string> | ToArray<number>
// 结果：string[] | number[]

// 不是：(string | number)[]
```

### 阻止分发

用元组包裹以阻止分发：

```typescript
type ToArrayNonDistributive<T> = [T] extends [any] ? T[] : never;

type Result = ToArrayNonDistributive<string | number>;
// 结果：(string | number)[]
```

## 实际应用：可选参数

```typescript
interface BaseRouterConfig {
  search?: string[];
}

type TupleToSearchParams<T extends string[]> = {
  [K in T[number]]?: string;
};

// 仅在 search 已定义且为字符串数组时转换
type SearchParams<TConfig extends BaseRouterConfig, TRoute extends keyof TConfig> =
  TConfig[TRoute]["search"] extends string[]
    ? TupleToSearchParams<TConfig[TRoute]["search"]>
    : undefined;
```

## 在函数参数中使用条件类型

```typescript
const makeRouter = <TConfig extends Record<string, { search?: string[] }>>(
  config: TConfig
) => {
  return {
    goTo: <TRoute extends keyof TConfig>(
      route: TRoute,
      // 仅当路由定义了 search 时才允许搜索参数
      search?: TConfig[TRoute]["search"] extends string[]
        ? { [K in TConfig[TRoute]["search"][number]]?: string }
        : never
    ) => {
      // 实现
    },
  };
};

const router = makeRouter({
  "/": {},
  "/search": { search: ["query", "page"] },
});

router.goTo("/"); // 不允许 search 参数
router.goTo("/search", { query: "test", page: "1" }); // 需要 search 参数
```

## 用条件类型过滤

使用 `never` 过滤掉类型：

```typescript
type ExtractStrings<T> = T extends string ? T : never;

type Mixed = "a" | "b" | 1 | 2 | true;
type OnlyStrings = ExtractStrings<Mixed>; // "a" | "b"
```

`Extract` 和 `Exclude` 工具类型就是这样实现的：

```typescript
// 内置工具类型的实现
type Extract<T, U> = T extends U ? T : never;
type Exclude<T, U> = T extends U ? never : T;
```

## 嵌套条件类型

```typescript
type DeepReadonly<T> = T extends Function
  ? T
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;

interface User {
  name: string;
  address: {
    city: string;
    country: string;
  };
  greet: () => void;
}

type ReadonlyUser = DeepReadonly<User>;
// 所有属性（包括嵌套属性）都是 readonly
// 函数保持不变
```

## 检查空类型

```typescript
// 检查数组类型是否为空
type IsEmptyArray<T extends any[]> = T extends []
  ? true
  : T extends [any, ...any[]]
  ? false
  : boolean; // 长度未知的数组

type Test1 = IsEmptyArray<[]>; // true
type Test2 = IsEmptyArray<[1]>; // false
type Test3 = IsEmptyArray<string[]>; // boolean（编译时未知）
```

## 非空数组检查

```typescript
// 确保数组至少有一个元素
type NonEmptyArray<T extends any[]> = T extends [infer First, ...infer Rest]
  ? [First, ...Rest]
  : never;

type Config = {
  fields: ["name", "email"]; // 非空
};

// 在条件类型中使用
type HasFields<T extends { fields?: string[] }> =
  T["fields"] extends [string, ...string[]]
    ? true
    : false;
```

## 常见模式

### 解包 Promise 类型

```typescript
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;

type Test1 = UnwrapPromise<Promise<string>>; // string
type Test2 = UnwrapPromise<string>; // string（原样返回）
```

### 解包数组类型

```typescript
type UnwrapArray<T> = T extends (infer U)[] ? U : T;

type Test1 = UnwrapArray<string[]>; // string
type Test2 = UnwrapArray<number>; // number（原样返回）
```

### 将所有属性变为可空

```typescript
type Nullable<T> = T extends object
  ? { [K in keyof T]: T[K] | null }
  : T | null;
```

## 何时使用条件类型

- **类型变换**：根据输入产生不同输出类型
- **过滤联合类型**：提取或排除特定类型
- **可选类型特性**：根据配置启用特性
- **类型守卫**：根据条件返回不同类型
- **递归类型**：递归类型定义中的基础情况

## 常见陷阱

### 忘记分发行为

```typescript
type WrongIsArray<T> = T extends any[] ? true : false;
type Test = WrongIsArray<string | number[]>; // boolean（发生了分发！）

// 如果要检查整个联合类型：
type CorrectIsArray<T> = [T] extends [any[]] ? true : false;
type Test2 = CorrectIsArray<string | number[]>; // false
```

### 条件过于复杂

有时联合类型或函数重载更简单：

```typescript
// 过于复杂
type ProcessResult<T> = T extends string
  ? { type: "string"; value: string }
  : T extends number
  ? { type: "number"; value: number }
  : never;

// 用可辨识联合更简单
type Result =
  | { type: "string"; value: string }
  | { type: "number"; value: number };
```

### 忘记 false 分支

```typescript
// 始终提供合理的 false 分支
type ExtractName<T> = T extends { name: infer N } ? N : never;

// 考虑：当 T 没有 name 时会发生什么？
type Test = ExtractName<{ age: number }>; // never
```
