---
name: type-narrowing
description: 通过控制流分析缩窄类型
metadata:
  tags: narrowing, type-guards, control-flow, discriminated-unions
---

# 类型缩窄

## 概述

类型缩窄是 TypeScript 基于控制流分析细化类型的能力。当你在代码中检查类型条件时，TypeScript 会在该代码块内缩窄类型。

## 内置缩窄

### `typeof` 守卫

```typescript
function processValue(value: string | number) {
  if (typeof value === "string") {
    // value 在这里是 string
    return value.toUpperCase();
  }
  // value 在这里是 number
  return value.toFixed(2);
}
```

### `instanceof` 守卫

```typescript
function logError(error: Error | string) {
  if (error instanceof Error) {
    // error 在这里是 Error
    console.log(error.stack);
  } else {
    // error 在这里是 string
    console.log(error);
  }
}
```

### 真值缩窄

```typescript
function printName(name: string | null | undefined) {
  if (name) {
    // name 在这里是 string（真值）
    console.log(name.toUpperCase());
  }
}
```

### 相等性缩窄

```typescript
function example(x: string | number, y: string | boolean) {
  if (x === y) {
    // 两者在这里都是 string（唯一公共类型）
    console.log(x.toUpperCase());
    console.log(y.toUpperCase());
  }
}
```

### `in` 操作符

```typescript
interface Fish {
  swim: () => void;
}

interface Bird {
  fly: () => void;
}

function move(animal: Fish | Bird) {
  if ("swim" in animal) {
    // animal 在这里是 Fish
    animal.swim();
  } else {
    // animal 在这里是 Bird
    animal.fly();
  }
}
```

## 可辨识联合

使用公共属性区分类型：

```typescript
interface Circle {
  kind: "circle";
  radius: number;
}

interface Rectangle {
  kind: "rectangle";
  width: number;
  height: number;
}

interface Triangle {
  kind: "triangle";
  base: number;
  height: number;
}

type Shape = Circle | Rectangle | Triangle;

function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      // shape 在这里是 Circle
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      // shape 在这里是 Rectangle
      return shape.width * shape.height;
    case "triangle":
      // shape 在这里是 Triangle
      return (shape.base * shape.height) / 2;
  }
}
```

### 穷尽性检查

使用 `never` 确保所有情况都已处理：

```typescript
function getArea(shape: Shape): number {
  switch (shape.kind) {
    case "circle":
      return Math.PI * shape.radius ** 2;
    case "rectangle":
      return shape.width * shape.height;
    case "triangle":
      return (shape.base * shape.height) / 2;
    default:
      // 如果新增了 shape 类型，这里会报错
      const _exhaustiveCheck: never = shape;
      throw new Error(`Unhandled shape: ${_exhaustiveCheck}`);
  }
}
```

## 自定义类型守卫

### 类型谓词

返回 `value is Type` 的函数：

```typescript
interface Fish {
  swim: () => void;
}

interface Bird {
  fly: () => void;
}

function isFish(pet: Fish | Bird): pet is Fish {
  return (pet as Fish).swim !== undefined;
}

function move(pet: Fish | Bird) {
  if (isFish(pet)) {
    // pet 在这里是 Fish
    pet.swim();
  } else {
    // pet 在这里是 Bird
    pet.fly();
  }
}
```

### 泛型类型守卫

```typescript
function isNotNull<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

const values = [1, null, 2, undefined, 3];
const filtered = values.filter(isNotNull);
// filtered 是 number[]
```

### 对象属性检查

```typescript
function hasProperty<T extends object, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

const data: unknown = { name: "Alice" };

if (typeof data === "object" && data !== null && hasProperty(data, "name")) {
  // data.name 现在可以访问
  console.log(data.name);
}
```

## 断言函数

输入无效时抛出异常的函数：

```typescript
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== "string") {
    throw new Error(`Expected string, got ${typeof value}`);
  }
}

function processInput(input: unknown) {
  assertIsString(input);
  // input 在这里是 string
  console.log(input.toUpperCase());
}
```

### 用于对象

```typescript
interface User {
  id: string;
  name: string;
}

function assertIsUser(value: unknown): asserts value is User {
  if (
    typeof value !== "object" ||
    value === null ||
    !("id" in value) ||
    !("name" in value)
  ) {
    throw new Error("Invalid user object");
  }
}

function handleData(data: unknown) {
  assertIsUser(data);
  // data 在这里是 User
  console.log(data.name);
}
```

### 重要：断言函数语法

必须使用 `function` 声明，不能用箭头函数：

```typescript
// 报错：Assertions require every name in the call target to be
// declared with an explicit type annotation.
const assertString = (value: unknown): asserts value is string => {
  if (typeof value !== "string") throw new Error("Not a string");
};

// 正确
function assertString(value: unknown): asserts value is string {
  if (typeof value !== "string") throw new Error("Not a string");
}
```

## 与不透明类型结合的缩窄

将类型谓词与不透明类型结合验证数据：

```typescript
type ValidEmail = string & { __brand: "ValidEmail" };

function isValidEmail(email: string): email is ValidEmail {
  return email.includes("@") && email.includes(".");
}

function sendEmail(email: ValidEmail) {
  // 我们知道 email 已通过验证
}

function handleSubmit(email: string) {
  if (!isValidEmail(email)) {
    throw new Error("Invalid email");
  }
  // email 在这里是 ValidEmail
  sendEmail(email);
}
```

## 用类型守卫过滤数组

```typescript
type Item = { type: "a"; value: string } | { type: "b"; count: number };

const items: Item[] = [
  { type: "a", value: "hello" },
  { type: "b", count: 42 },
];

// 过滤为特定类型
const typeAItems = items.filter(
  (item): item is { type: "a"; value: string } => item.type === "a"
);
// typeAItems 是 { type: "a"; value: string }[]
```

## 控制流分析的限制

TypeScript 不总能追踪跨函数调用的类型缩窄：

```typescript
function isString(x: unknown): x is string {
  return typeof x === "string";
}

function example(value: string | number) {
  const isStr = isString(value);

  if (isStr) {
    // value 在这里仍然是 string | number！
    // TypeScript 不会基于布尔变量缩窄
  }

  // 必须内联检查
  if (isString(value)) {
    // value 在这里是 string
  }
}
```

## 实际示例：API 响应处理

```typescript
interface SuccessResponse<T> {
  status: "success";
  data: T;
}

interface ErrorResponse {
  status: "error";
  error: {
    code: string;
    message: string;
  };
}

type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

function isSuccess<T>(response: ApiResponse<T>): response is SuccessResponse<T> {
  return response.status === "success";
}

async function fetchUser(): Promise<ApiResponse<User>> {
  // ...
}

async function handleUser() {
  const response = await fetchUser();

  if (isSuccess(response)) {
    // response.data 是 User
    console.log(response.data.name);
  } else {
    // response.error 可访问
    console.error(response.error.message);
  }
}
```

## 各技术适用场景

| 技术 | 使用场景 |
|------|---------|
| `typeof` | 原始类型检查 |
| `instanceof` | 类实例检查 |
| `in` 操作符 | 属性存在性检查 |
| 可辨识联合 | 共有判别属性的多个关联类型 |
| 类型谓词 | 自定义缩窄逻辑 |
| 断言函数 | 验证并提前抛错 |

## 常见陷阱

### 缩窄不会跨回调持久

```typescript
function example(value: string | null) {
  if (value !== null) {
    // value 在这里是 string

    setTimeout(() => {
      // value 又变成 string | null！
      // TypeScript 对回调持保守态度
    }, 0);
  }
}
```

### 类型守卫必须返回布尔值

```typescript
// 错误 - 不会缩窄
function isFish(pet: Fish | Bird) {
  return "swim" in pet; // 只是返回 boolean
}

// 正确 - 缩窄类型
function isFish(pet: Fish | Bird): pet is Fish {
  return "swim" in pet;
}
```

### 复杂条件需谨慎

```typescript
function example(value: { a?: string; b?: number }) {
  // 这不会按预期缩窄
  if (value.a || value.b) {
    // a 和 b 都不能保证存在
  }

  // 使用具体检查
  if (value.a !== undefined) {
    // value.a 在这里是 string
  }
}
```
