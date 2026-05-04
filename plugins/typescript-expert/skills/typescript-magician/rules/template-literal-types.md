---
name: template-literal-types
description: 使用模板字面量类型在类型层面操作字符串
metadata:
  tags: template-literals, string-types, type-manipulation
---

# 模板字面量类型

## 概述

模板字面量类型允许使用与 JavaScript 模板字面量相同的语法操作字符串类型。与 `infer` 结合，可以在类型层面实现强大的字符串解析和变换。

## 基本语法

```typescript
type Greeting = `Hello, ${string}`;

const valid: Greeting = "Hello, World"; // 正确
const invalid: Greeting = "Hi, World"; // 报错：不匹配模式
```

## 字符串字面量联合类型

模板字面量会对联合类型进行分发：

```typescript
type Size = "small" | "medium" | "large";
type Color = "red" | "blue" | "green";

type SizedColor = `${Size}-${Color}`;
// "small-red" | "small-blue" | "small-green" |
// "medium-red" | "medium-blue" | "medium-green" |
// "large-red" | "large-blue" | "large-green"
```

## 使用 `infer` 进行模式匹配

提取字符串类型的部分内容：

```typescript
// 移除 "maps:" 前缀
type RemoveMaps<T> = T extends `maps:${infer Rest}` ? Rest : T;

type Test1 = RemoveMaps<"maps:longitude">; // "longitude"
type Test2 = RemoveMaps<"maps:latitude">; // "latitude"
type Test3 = RemoveMaps<"other">; // "other"
```

### 移除后缀

```typescript
type RemovePostSuffix<T> = T extends `${infer Prefix}:post` ? Prefix : T;

type Test = RemovePostSuffix<"attribute:post">; // "attribute"
```

### 按分隔符拆分

```typescript
type Split<S extends string, D extends string> =
  S extends `${infer Head}${D}${infer Tail}`
    ? [Head, ...Split<Tail, D>]
    : S extends ""
    ? []
    : [S];

type Parts = Split<"a-b-c", "-">; // ["a", "b", "c"]
```

## 内置字符串操作类型

TypeScript 提供了大小写转换的工具类型：

```typescript
type Upper = Uppercase<"hello">; // "HELLO"
type Lower = Lowercase<"HELLO">; // "hello"
type Cap = Capitalize<"hello">; // "Hello"
type Uncap = Uncapitalize<"Hello">; // "hello"
```

## 实际示例

### CSS 属性转驼峰

```typescript
type CamelCase<S extends string> =
  S extends `${infer P1}-${infer P2}${infer P3}`
    ? `${Lowercase<P1>}${Uppercase<P2>}${CamelCase<P3>}`
    : Lowercase<S>;

type Test = CamelCase<"background-color">; // "backgroundColor"
type Test2 = CamelCase<"border-top-width">; // "borderTopWidth"
```

### 事件名生成

```typescript
type EventName<T extends string> = `on${Capitalize<T>}`;

type MouseEvents = "click" | "mousedown" | "mouseup";
type MouseHandlers = EventName<MouseEvents>;
// "onClick" | "onMousedown" | "onMouseup"
```

### Getter/Setter 名称

```typescript
type Getter<T extends string> = `get${Capitalize<T>}`;
type Setter<T extends string> = `set${Capitalize<T>}`;

type PropName = "name" | "age";
type Getters = Getter<PropName>; // "getName" | "getAge"
type Setters = Setter<PropName>; // "setName" | "setAge"
```

## 对象键变换

### 为键添加前缀

```typescript
type AddPrefix<T, P extends string> = {
  [K in keyof T as K extends string ? `${P}${K}` : K]: T[K];
};

interface User {
  name: string;
  age: number;
}

type PrefixedUser = AddPrefix<User, "user_">;
// { user_name: string; user_age: number }
```

### 为键添加后缀

```typescript
type AddSuffix<T, S extends string> = {
  [K in keyof T as K extends string ? `${K}${S}` : never]: T[K];
};

interface Data {
  a: number;
  b: number;
}

type NewData = AddSuffix<Data, "_new">;
// { a_new: number; b_new: number }
```

### 将 snake_case 键转为 camelCase

```typescript
type SnakeToCamel<S extends string> =
  S extends `${infer P1}_${infer P2}${infer P3}`
    ? `${Lowercase<P1>}${Uppercase<P2>}${SnakeToCamel<P3>}`
    : S;

type CamelizeKeys<T> = {
  [K in keyof T as K extends string ? SnakeToCamel<K> : K]: T[K];
};

interface ApiResponse {
  user_id: string;
  first_name: string;
  last_name: string;
}

type CamelResponse = CamelizeKeys<ApiResponse>;
// { userId: string; firstName: string; lastName: string }
```

## 路由参数提取

```typescript
type ExtractRouteParams<T extends string> =
  T extends `${string}:${infer Param}/${infer Rest}`
    ? Param | ExtractRouteParams<`/${Rest}`>
    : T extends `${string}:${infer Param}`
    ? Param
    : never;

type Params = ExtractRouteParams<"/users/:userId/posts/:postId">;
// "userId" | "postId"

// 创建类型化的参数对象
type RouteParams<T extends string> = {
  [K in ExtractRouteParams<T>]: string;
};

type UserPostParams = RouteParams<"/users/:userId/posts/:postId">;
// { userId: string; postId: string }
```

## 验证模式

### 邮箱模式（简化版）

```typescript
type ValidEmail = `${string}@${string}.${string}`;

function validateEmail<T extends string>(
  email: T extends ValidEmail ? T : never
): T {
  return email;
}

validateEmail("user@example.com"); // 正确
validateEmail("invalid"); // 报错
```

### URL 模式

```typescript
type Protocol = "http" | "https";
type ValidUrl = `${Protocol}://${string}`;

function fetchUrl(url: ValidUrl): Promise<Response> {
  return fetch(url);
}

fetchUrl("https://api.example.com"); // 正确
fetchUrl("ftp://files.example.com"); // 报错
```

## 复杂解析

### 解析查询字符串类型

```typescript
type ParseQueryString<T extends string> =
  T extends `${infer Key}=${infer Value}&${infer Rest}`
    ? { [K in Key]: Value } & ParseQueryString<Rest>
    : T extends `${infer Key}=${infer Value}`
    ? { [K in Key]: Value }
    : {};

type QueryParams = ParseQueryString<"name=John&age=30&city=NYC">;
// { name: "John" } & { age: "30" } & { city: "NYC" }
```

### 解析点号路径

```typescript
type ParsePath<T extends string> =
  T extends `${infer Key}.${infer Rest}`
    ? [Key, ...ParsePath<Rest>]
    : [T];

type Path = ParsePath<"user.address.city">; // ["user", "address", "city"]
```

## 何时使用模板字面量类型

- **字符串验证**：确保字符串匹配预期模式
- **键变换**：系统地重命名对象键
- **路由类型化**：类型安全的路由参数
- **事件系统**：生成事件处理函数名
- **代码生成**：创建类型安全的字符串模式
- **API 契约**：确保 URL/路径模式正确

## 常见陷阱

### 复杂度限制

TypeScript 有递归限制，很深的模板字面量操作可能失败：

```typescript
// 超长字符串可能触及递归限制
type DeepSplit<S extends string> = S extends `${infer H}${infer T}`
  ? [H, ...DeepSplit<T>]
  : [];
```

### 贪婪匹配

模板字面量采用贪婪匹配：

```typescript
// 这会捕获最后一个 .json 之前的所有内容
type GetPath<T> = T extends `${infer Path}.json` ? Path : never;

type Test = GetPath<"folder/file.backup.json">;
// "folder/file.backup"（包含额外的 .backup）
```

### Symbol 键

模板字面量只能用于字符串键：

```typescript
type AddPrefix<T, P extends string> = {
  // 需要检查 K extends string 以过滤掉 symbol
  [K in keyof T as K extends string ? `${P}${K}` : never]: T[K];
};
```

## 最佳实践

1. **保持模式简单**：复杂的递归模式难以调试
2. **提供后备类型**：优雅处理不匹配的情况
3. **测试边界情况**：空字符串、单字符、无匹配
4. **注意性能**：深度递归会拖慢类型检查
5. **使用内置工具**：优先用 `Uppercase`、`Lowercase` 等而非自定义实现
