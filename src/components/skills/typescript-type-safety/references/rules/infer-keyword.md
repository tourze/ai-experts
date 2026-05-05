---
name: infer-keyword
description: 在条件类型中使用 infer 提取类型
metadata:
  tags: infer, conditional-types, type-extraction, pattern-matching
---

# `infer` 关键字

## 概述

`infer` 关键字允许在条件类型中提取和捕获类型信息。它相当于类型层面的模式匹配——你定义一个模式并捕获其中的部分。

## 基本语法

```typescript
type ExtractType<T> = T extends SomePattern<infer U> ? U : never;
//                                          ^^^^^^^^
//                                     将这部分捕获到 U 中
```

## 简单示例

### 提取数组元素类型

```typescript
type ArrayElement<T> = T extends (infer U)[] ? U : never;

type Test1 = ArrayElement<string[]>; // string
type Test2 = ArrayElement<number[]>; // number
type Test3 = ArrayElement<(string | number)[]>; // string | number
type Test4 = ArrayElement<string>; // never（不是数组）
```

### 提取 Promise 值

```typescript
type PromiseValue<T> = T extends Promise<infer U> ? U : never;

type Test1 = PromiseValue<Promise<string>>; // string
type Test2 = PromiseValue<Promise<number>>; // number
type Test3 = PromiseValue<string>; // never
```

### 提取对象属性类型

```typescript
type GetData<T> = T extends { data: infer TData } ? TData : never;

type Test1 = GetData<{ data: string }>; // string
type Test2 = GetData<{ data: number[] }>; // number[]
type Test3 = GetData<{ other: string }>; // never
```

## 模板字面量类型提取

`infer` 与模板字面量类型结合非常强大：

```typescript
// 移除 "maps:" 前缀
type RemoveMaps<T> = T extends `maps:${infer Rest}` ? Rest : T;

type Test1 = RemoveMaps<"maps:longitude">; // "longitude"
type Test2 = RemoveMaps<"maps:latitude">; // "latitude"
type Test3 = RemoveMaps<"other">; // "other"（不匹配，返回 T）
```

### 模板字面量中的多个捕获

```typescript
// 解析路由参数
type ParseRoute<T> = T extends `${infer Start}:${infer Param}/${infer Rest}`
  ? { start: Start; param: Param; rest: ParseRoute<Rest> }
  : T extends `${infer Start}:${infer Param}`
  ? { start: Start; param: Param }
  : T;

type Route = ParseRoute<"/users/:id/posts/:postId">;
// 提取的参数构成嵌套结构
```

### 提取前/后模式

```typescript
// 获取 ":" 之前的所有内容
type Before<T> = T extends `${infer Prefix}:${string}` ? Prefix : T;

// 获取 ":" 之后的所有内容
type After<T> = T extends `${string}:${infer Suffix}` ? Suffix : T;

type Test1 = Before<"prefix:suffix">; // "prefix"
type Test2 = After<"prefix:suffix">; // "suffix"
```

## 函数类型提取

### 提取返回类型

```typescript
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

type Test = MyReturnType<() => string>; // string
```

### 提取参数类型

```typescript
type MyParameters<T> = T extends (...args: infer P) => any ? P : never;

type Test = MyParameters<(a: string, b: number) => void>;
// [a: string, b: number]
```

### 提取第一个参数

```typescript
type FirstArg<T> = T extends (first: infer F, ...rest: any[]) => any
  ? F
  : never;

type Test = FirstArg<(name: string, age: number) => void>; // string
```

### 提取构造函数参数

```typescript
type ConstructorParams<T> = T extends new (...args: infer P) => any
  ? P
  : never;

class User {
  constructor(public name: string, public age: number) {}
}

type UserParams = ConstructorParams<typeof User>; // [string, number]
```

## 一个条件中的多个 `infer`

可以在一个条件中使用多个 `infer` 捕获：

```typescript
// 从 "key=value" 字符串提取键值
type ParseKeyValue<T> = T extends `${infer Key}=${infer Value}`
  ? { key: Key; value: Value }
  : never;

type Test = ParseKeyValue<"name=John">;
// { key: "name"; value: "John" }
```

## 带约束的 infer

可以为推断类型添加约束：

```typescript
// 仅在值为 string 时推断
type ExtractString<T> = T extends { value: infer V extends string }
  ? V
  : never;

type Test1 = ExtractString<{ value: "hello" }>; // "hello"
type Test2 = ExtractString<{ value: 123 }>; // never
```

## 递归类型提取

```typescript
// 深层解包嵌套 Promise
type DeepAwaited<T> = T extends Promise<infer U>
  ? DeepAwaited<U>
  : T;

type Test = DeepAwaited<Promise<Promise<Promise<string>>>>; // string
```

## 实际示例

### 类型安全的事件发射器

```typescript
type EventHandler<T> = T extends (event: infer E) => void ? E : never;

interface Events {
  click: (event: MouseEvent) => void;
  keydown: (event: KeyboardEvent) => void;
}

type ClickEvent = EventHandler<Events["click"]>; // MouseEvent
```

### 提取路由参数

```typescript
type ExtractParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractParams<`/${Rest}`>
    : T extends `${string}:${infer Param}`
    ? Param
    : never;

type Params = ExtractParams<"/users/:userId/posts/:postId">;
// "userId" | "postId"
```

### 对象键变换

```typescript
// 移除所有对象键的 "maps:" 前缀
type RemoveMaps<T> = T extends `maps:${infer Rest}` ? Rest : T;

type RemoveMapsPrefixFromObj<T> = {
  [K in keyof T as RemoveMaps<K>]: T[K];
};

interface ApiData {
  "maps:longitude": string;
  "maps:latitude": string;
  city: string;
}

type Cleaned = RemoveMapsPrefixFromObj<ApiData>;
// { longitude: string; latitude: string; city: string }
```

### 提取泛型参数

```typescript
type ExtractGeneric<T> = T extends Array<infer U>
  ? U
  : T extends Map<infer K, infer V>
  ? { key: K; value: V }
  : T extends Set<infer U>
  ? U
  : never;

type Test1 = ExtractGeneric<Array<string>>; // string
type Test2 = ExtractGeneric<Map<string, number>>; // { key: string; value: number }
type Test3 = ExtractGeneric<Set<boolean>>; // boolean
```

## 常见陷阱

### infer 的位置很关键

```typescript
// 捕获第一个匹配位置
type First<T> = T extends [infer F, ...any[]] ? F : never;
type Last<T> = T extends [...any[], infer L] ? L : never;

type TestFirst = First<[1, 2, 3]>; // 1
type TestLast = Last<[1, 2, 3]>; // 3
```

### 模板字面量的贪婪匹配

```typescript
// 贪婪：尽可能多地捕获
type GetPath<T> = T extends `${infer Path}.json` ? Path : never;

type Test = GetPath<"folder/file.name.json">;
// "folder/file.name"（不是 "folder/file"）
```

### infer 的联合分发

```typescript
type ExtractArray<T> = T extends (infer U)[] ? U : never;

// 在联合上分发
type Test = ExtractArray<string[] | number[]>;
// string | number（不是 (string | number)[]）
```

## 何时使用 `infer`

- **类型提取**：从复杂结构中提取类型
- **字符串解析**：从模板字面量类型中提取部分
- **函数分析**：获取参数/返回类型
- **模式匹配**：匹配并捕获类型模式
- **递归类型**：在递归结构中提取类型

## 最佳实践

1. **提供后备类型**：始终处理 `false` 分支
2. **模式要具体**：更具体的模式 = 更好的推断
3. **注意分发行为**：记住联合类型会分发
4. **有意义的命名**：使用描述性名称如 `TData`、`TKey`、`TValue`
