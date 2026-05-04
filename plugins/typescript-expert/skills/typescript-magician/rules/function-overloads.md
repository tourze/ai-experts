---
name: function-overloads
description: 使用函数重载处理复杂的函数签名
metadata:
  tags: overloads, function-signatures, polymorphism, type-narrowing
---

# 函数重载

## 概述

函数重载允许为单个函数实现定义多个函数签名。TypeScript 根据传入的参数选择匹配的签名。

## 基本语法

```typescript
// 重载签名（调用方看到的）
function greet(name: string): string;
function greet(firstName: string, lastName: string): string;

// 实现签名（必须兼容所有重载）
function greet(nameOrFirst: string, lastName?: string): string {
  if (lastName) {
    return `Hello, ${nameOrFirst} ${lastName}!`;
  }
  return `Hello, ${nameOrFirst}!`;
}

// 使用 - TypeScript 选择正确的重载
greet("Alice"); // 使用第一个重载
greet("Alice", "Smith"); // 使用第二个重载
```

## 重载解析：从上到下

TypeScript 按从上到下的顺序尝试重载，使用第一个匹配的：

```typescript
// 顺序很重要！更具体的重载应放在前面
function processValue(value: string): string;
function processValue(value: number): number;
function processValue(value: string | number): string | number {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  return value * 2;
}

const str = processValue("hello"); // 类型：string
const num = processValue(42); // 类型：number
```

## 实际示例：DOM querySelector

DOM 的 `querySelector` 使用重载进行元素类型推断：

```typescript
// lib.dom.d.ts 中定义的简化版本
interface Document {
  // 已知 HTML 元素的特定重载
  querySelector<K extends keyof HTMLElementTagNameMap>(
    selectors: K
  ): HTMLElementTagNameMap[K] | null;

  // 自定义选择器的后备重载
  querySelector(selectors: string): Element | null;
}

const body = document.querySelector("body"); // 类型：HTMLBodyElement | null
const custom = document.querySelector(".my-class"); // 类型：Element | null
```

## 模式：用重载包装函数

包装函数时，镜像其重载以保留类型推断：

```typescript
// 问题：简单包装丢失重载行为
export function nonNullQuerySelector(tag: string) {
  const element = document.querySelector(tag);
  if (!element) {
    throw new Error(`Element not found: ${tag}`);
  }
  return element;
}

const body = nonNullQuerySelector("body"); // 类型：Element（丢失了 HTMLBodyElement！）

// 解决方案：添加镜像 querySelector 的重载
export function nonNullQuerySelector<K extends keyof HTMLElementTagNameMap>(
  tag: K
): HTMLElementTagNameMap[K];
export function nonNullQuerySelector(tag: string): Element;
export function nonNullQuerySelector(tag: string): Element {
  const element = document.querySelector(tag);
  if (!element) {
    throw new Error(`Element not found: ${tag}`);
  }
  return element;
}

const body = nonNullQuerySelector("body"); // 类型：HTMLBodyElement
const custom = nonNullQuerySelector(".custom"); // 类型：Element
```

## 类中的方法重载

```typescript
class Calculator {
  add(a: number, b: number): number;
  add(a: string, b: string): string;
  add(a: number | string, b: number | string): number | string {
    if (typeof a === "number" && typeof b === "number") {
      return a + b;
    }
    return String(a) + String(b);
  }
}

const calc = new Calculator();
const sum = calc.add(1, 2); // 类型：number
const concat = calc.add("hello", "world"); // 类型：string
```

## 对象类型中的重载

```typescript
interface StringOrNumberFunc {
  (value: string): string;
  (value: number): number;
}

const process: StringOrNumberFunc = (value: string | number) => {
  if (typeof value === "string") {
    return value.toUpperCase();
  }
  return value * 2;
};
```

## 事件处理模式

事件系统的常见模式：

```typescript
interface EventMap {
  click: MouseEvent;
  keydown: KeyboardEvent;
  submit: SubmitEvent;
}

interface EventEmitter {
  // 已知事件的特定重载
  on<K extends keyof EventMap>(
    event: K,
    handler: (e: EventMap[K]) => void
  ): void;

  // 自定义事件的后备重载
  on(event: string, handler: (e: Event) => void): void;
}

const emitter: EventEmitter = {
  on(event: string, handler: (e: any) => void) {
    // 实现
  },
};

// 处理函数类型被正确推断
emitter.on("click", (e) => {
  console.log(e.clientX); // e 是 MouseEvent
});

emitter.on("keydown", (e) => {
  console.log(e.key); // e 是 KeyboardEvent
});

emitter.on("custom", (e) => {
  // e 是 Event（后备）
});
```

## 重载 vs 联合类型

有时联合类型比重载更简单：

```typescript
// 重载 - 当返回类型依赖于输入类型时
function parse(input: string): object;
function parse(input: object): string;
function parse(input: string | object): string | object {
  if (typeof input === "string") {
    return JSON.parse(input);
  }
  return JSON.stringify(input);
}

// 联合 - 当返回类型始终相同时
function process(input: string | number): string {
  return String(input);
}
```

## 带可选参数的重载

```typescript
function createElement(tag: "input"): HTMLInputElement;
function createElement(tag: "button", text?: string): HTMLButtonElement;
function createElement(tag: string, text?: string): HTMLElement;
function createElement(tag: string, text?: string): HTMLElement {
  const element = document.createElement(tag);
  if (text) {
    element.textContent = text;
  }
  return element;
}
```

## 常见陷阱

### 实现签名的可见性

实现签名对调用方**不可见**：

```typescript
function example(a: string): string;
function example(a: number): number;
function example(a: string | number): string | number {
  return typeof a === "string" ? a.toUpperCase() : a * 2;
}

// 报错：没有匹配的重载
example(true); // 即使实现接受任何类型
```

### 重载顺序错误

具体重载应放在通用重载之前：

```typescript
// 错误 - 通用重载匹配一切
function bad(x: any): any;
function bad(x: string): string; // 永远不会到达！
function bad(x: any): any {
  return x;
}

// 正确 - 具体重载在前
function good(x: string): string;
function good(x: any): any;
function good(x: any): any {
  return x;
}
```

### 实现必须兼容

实现签名必须处理所有重载情况：

```typescript
function process(x: string): string;
function process(x: number): number;

// 报错：实现签名必须兼容
function process(x: string): string {
  return x.toUpperCase();
}

// 正确
function process(x: string | number): string | number {
  if (typeof x === "string") {
    return x.toUpperCase();
  }
  return x * 2;
}
```

## 何时使用重载

- **返回类型依赖输入类型**：不同输入产生不同输出类型
- **包装外部 API**：镜像被包装函数的重载
- **事件系统**：将事件名映射到事件类型
- **工厂函数**：不同配置产生不同类型
- **API 兼容性**：为同一操作提供多种调用签名

## 何时不使用重载

- **简单联合**：如果返回类型不依赖输入类型，用联合类型
- **可选参数**：通常比多个重载更简单
- **泛型**：有时单个泛型签名更清晰
