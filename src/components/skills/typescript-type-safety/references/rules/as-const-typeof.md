---
name: as-const-typeof
description: 使用 as const 和 typeof 从运行时值派生类型
metadata:
  tags: as-const, typeof, literal-types, inference, const-assertion
---

# 使用 `as const` 和 `typeof` 从运行时派生类型

## 概述

`as const` 与 `typeof` 的组合是 TypeScript 中最强大的模式之一，可以从运行时值派生类型。此模式允许创建在运行时和编译时都有效的单一事实来源。

## `as const` 断言

`as const` 是一个 const 断言，使对象深层只读并推断字面量类型而非放宽类型。

```typescript
// 不使用 as const - 类型被放宽
const config = {
  GROUP: "group",
  ANNOUNCEMENT: "announcement",
};
// 类型：{ GROUP: string; ANNOUNCEMENT: string }

// 使用 as const - 保留字面量类型
const config = {
  GROUP: "group",
  ANNOUNCEMENT: "announcement",
} as const;
// 类型：{ readonly GROUP: "group"; readonly ANNOUNCEMENT: "announcement" }
```

## `as const` 的核心优势

1. **不可变性**：属性递归变为 readonly
2. **字面量推断**：值被推断为字面量类型，而非放宽类型
3. **数组元组推断**：数组变为带字面量类型的 readonly 元组

```typescript
const routes = ["home", "about", "contact"] as const;
// 类型：readonly ["home", "about", "contact"]
// 不使用 as const：string[]
```

## 使用 `typeof` 将运行时拉入类型世界

使用 `typeof` 从运行时值提取类型：

```typescript
const programModeEnumMap = {
  GROUP: "group",
  ANNOUNCEMENT: "announcement",
  ONE_ON_ONE: "1on1",
  SELF_DIRECTED: "selfDirected",
} as const;

// 提取对象的类型
type ProgramMap = typeof programModeEnumMap;

// 提取键作为联合类型
type BackendProgram = keyof typeof programModeEnumMap;
// 类型："GROUP" | "ANNOUNCEMENT" | "ONE_ON_ONE" | "SELF_DIRECTED"

// 使用索引访问提取值作为联合类型
type FrontendProgram = typeof programModeEnumMap[keyof typeof programModeEnumMap];
// 类型："group" | "announcement" | "1on1" | "selfDirected"
```

## 模式：`Obj[keyof Obj]` 获取对象值

此模式相当于类型世界的 `Object.values()`：

```typescript
const statusCodes = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  NOT_FOUND: 404,
} as const;

type StatusCode = typeof statusCodes[keyof typeof statusCodes];
// 类型：200 | 201 | 400 | 404
```

## 模式：用联合索引选取子集

可以通过使用特定键的联合来选取部分值：

```typescript
const programModeEnumMap = {
  GROUP: "group",
  ANNOUNCEMENT: "announcement",
  ONE_ON_ONE: "1on1",
  SELF_DIRECTED: "selfDirected",
} as const;

type ProgramMap = typeof programModeEnumMap;

// 仅选取个人项目类型
type IndividualProgram = ProgramMap["ONE_ON_ONE" | "SELF_DIRECTED"];
// 类型："1on1" | "selfDirected"
```

## 何时使用此模式

- **配置对象**：定义一次配置，运行时和编译时都用
- **枚举替代**：创建带字符串/数字值的类型安全枚举
- **路由定义**：定义路由及其元数据
- **API 映射**：在不同表示之间映射（如后端 vs 前端）
- **事件类型**：定义事件名及其载荷

## 常见陷阱

### 忘记 `as const`

不使用 `as const` 会丢失字面量类型推断：

```typescript
// 错误 - 值被放宽为 string
const colors = {
  RED: "#ff0000",
  GREEN: "#00ff00",
};
type Color = typeof colors[keyof typeof colors]; // string

// 正确 - 保留字面量类型
const colors = {
  RED: "#ff0000",
  GREEN: "#00ff00",
} as const;
type Color = typeof colors[keyof typeof colors]; // "#ff0000" | "#00ff00"
```

### 尝试修改

`as const` 使对象变为 readonly - 尝试修改会导致编译错误：

```typescript
const config = {
  timeout: 5000,
} as const;

config.timeout = 10000; // 报错：无法赋值给 'timeout'，因为它是只读属性
```

## 完整示例

```typescript
// HTTP 方法的单一事实来源
const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  DELETE: "DELETE",
  PATCH: "PATCH",
} as const;

type HttpMethod = typeof HTTP_METHODS[keyof typeof HTTP_METHODS];
// 类型："GET" | "POST" | "PUT" | "DELETE" | "PATCH"

type SafeMethod = typeof HTTP_METHODS["GET"];
// 类型："GET"

type MutatingMethod = typeof HTTP_METHODS["POST" | "PUT" | "DELETE" | "PATCH"];
// 类型："POST" | "PUT" | "DELETE" | "PATCH"

function makeRequest(method: HttpMethod, url: string): void {
  // method 是类型安全的
}

makeRequest(HTTP_METHODS.GET, "/api/users"); // 正确
makeRequest("INVALID", "/api/users"); // 报错
```
