---
name: generics-basics
description: TypeScript 泛型类型与函数基础
metadata:
  tags: generics, type-parameters, constraints, inference
---

# 泛型基础

## 概述

泛型允许创建适用于多种类型的可复用组件，同时保持类型安全。它们是构建灵活、类型安全 API 的基础。

## 基本泛型函数

```typescript
// 不用泛型 - 丢失类型信息
function identity(value: any): any {
  return value;
}

// 使用泛型 - 保留类型
function identity<T>(value: T): T {
  return value;
}

const num = identity(42); // 类型：number（推断）
const str = identity("hello"); // 类型：string（推断）
const explicit = identity<boolean>(true); // 类型：boolean（显式）
```

## 推断依赖

当一个参数的类型依赖另一个时，使用泛型：

```typescript
// 返回类型依赖 config 中存在哪些键
const createComponent = <TConfig extends Record<string, string>>(
  config: TConfig,
) => {
  return (variant: keyof TConfig, ...otherClasses: string[]): string => {
    return config[variant] + " " + otherClasses.join(" ");
  };
};

// TConfig 被推断为 { primary: string; secondary: string }
const getButtonClasses = createComponent({
  primary: "bg-blue-300",
  secondary: "bg-green-300",
});

// variant 必须是 "primary" | "secondary"
getButtonClasses("primary", "px-4"); // 正确
getButtonClasses("tertiary", "px-4"); // 报错："tertiary" 不在键中
```

## 使用 `extends` 的泛型约束

约束泛型以确保具有必需的属性：

```typescript
// 无约束 - TFunc 可以是任何类型
type WrapFunction<TFunc> = (...args: any[]) => any;

// 有约束 - TFunc 必须是函数
type WrapFunction<TFunc extends (...args: any) => any> = (
  ...args: Parameters<TFunc>
) => ReturnType<TFunc>;
```

### 为什么约束很重要

```typescript
// 无约束
function getLength<T>(item: T): number {
  return item.length; // 报错：类型 'T' 上不存在属性 'length'
}

// 有约束
function getLength<T extends { length: number }>(item: T): number {
  return item.length; // 正确 - 我们知道 T 有 length
}

getLength("hello"); // 5
getLength([1, 2, 3]); // 3
getLength({ length: 10 }); // 10
getLength(42); // 报错：number 没有 length
```

## 默认泛型参数

为可选类型参数提供默认值：

```typescript
type WrapFunction<
  TFunc extends (...args: any) => any,
  TAdditional = {} // 默认为空对象
> = (
  ...args: Parameters<TFunc>
) => Promise<Awaited<ReturnType<TFunc>> & TAdditional>;

// 可以不传 TAdditional
type BasicWrapper = WrapFunction<typeof fetchUser>;

// 或传入 TAdditional
type ExtendedWrapper = WrapFunction<typeof fetchUser, { meta: string }>;
```

## 泛型插槽推断

TypeScript 根据使用方式推断泛型类型：

```typescript
// 泛型从传入的参数推断
const createComponent = <TConfig>(config: TConfig) => {
  return config;
};

// TConfig 被推断为 { primary: string; secondary: string }
const component = createComponent({
  primary: "bg-blue-300",
  secondary: "bg-green-300",
});
```

### 推断失效的情况

如果泛型没有在参数中使用，它会默认为 unknown：

```typescript
// 错误 - TConfig 没有在参数中使用，默认为 unknown
const createComponent = <TConfig>(config: Record<string, string>) => {
  // TConfig 在这里是 unknown
};

// 正确 - TConfig 就是参数类型
const createComponent = <TConfig extends Record<string, string>>(
  config: TConfig,
) => {
  // TConfig 从传入值推断
};
```

## 多个泛型参数

为相关但不同的类型使用多个参数：

```typescript
function map<TInput, TOutput>(
  items: TInput[],
  transform: (item: TInput) => TOutput
): TOutput[] {
  return items.map(transform);
}

// TInput 和 TOutput 都被推断
const numbers = map(["1", "2", "3"], (s) => parseInt(s));
// TInput: string, TOutput: number, 结果: number[]
```

## 模式：`keyof` 与泛型

结合 `keyof` 与泛型实现类型安全的属性访问：

```typescript
function getProperty<TObj, TKey extends keyof TObj>(
  obj: TObj,
  key: TKey
): TObj[TKey] {
  return obj[key];
}

const user = { name: "Alice", age: 30 };
const name = getProperty(user, "name"); // 类型：string
const age = getProperty(user, "age"); // 类型：number
const invalid = getProperty(user, "email"); // 报错："email" 不在 keyof 中
```

## 类中的泛型

```typescript
class Container<T> {
  private value: T;

  constructor(value: T) {
    this.value = value;
  }

  getValue(): T {
    return this.value;
  }

  map<U>(transform: (value: T) => U): Container<U> {
    return new Container(transform(this.value));
  }
}

const numContainer = new Container(42);
const strContainer = numContainer.map((n) => n.toString());
// strContainer 是 Container<string>
```

## 完整示例：组件工厂

```typescript
// 创建类型安全组件类生成器的工厂
export const createComponent = <TConfig extends Record<string, string>>(
  config: TConfig,
) => {
  // 返回需要合法 variant 键的函数
  return (variant: keyof TConfig, ...otherClasses: string[]): string => {
    return config[variant] + " " + otherClasses.join(" ");
  };
};

// 使用
const getButtonClasses = createComponent({
  primary: "bg-blue-500 text-white",
  secondary: "bg-gray-200 text-gray-800",
  danger: "bg-red-500 text-white",
});

// 类型安全：variant 必须是 "primary" | "secondary" | "danger"
const classes = getButtonClasses("primary", "px-4", "py-2");
// 结果："bg-blue-500 text-white px-4 py-2"

// 无效 variant 报类型错误
getButtonClasses("invalid"); // 报错！
```

## 何时使用泛型

- **类型保留**：需要通过函数保留类型信息时
- **推断依赖**：一个类型依赖另一个类型时
- **可复用组件**：构建适用于多种类型的 API 时
- **约束**：需要确保类型具有特定属性时
- **工厂函数**：创建返回类型化结果的函数时

## 常见陷阱

### 不必要的泛型

```typescript
// 错误 - 泛型没有提供价值
function greet<T extends string>(name: T): string {
  return `Hello, ${name}`;
}

// 正确 - 直接用 string
function greet(name: string): string {
  return `Hello, ${name}`;
}
```

### 过度约束

```typescript
// 错误 - 约束过于具体
function process<T extends { id: string; name: string; email: string }>(
  obj: T
): void {}

// 正确 - 只要求实际使用的属性
function process<T extends { id: string }>(obj: T): void {}
```

### 忘记添加约束

```typescript
// 错误 - 访问可能不存在的属性
function getName<T>(obj: T): string {
  return obj.name; // 报错：属性 'name' 不存在
}

// 正确 - 约束为有 name 的类型
function getName<T extends { name: string }>(obj: T): string {
  return obj.name;
}
```
