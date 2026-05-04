---
name: error-diagnosis
description: 诊断和理解 TypeScript 类型错误的策略
metadata:
  tags: errors, debugging, diagnosis, troubleshooting
---

# 诊断 TypeScript 错误

## 概述

TypeScript 的错误信息有时晦涩难懂，特别是涉及复杂泛型类型时。本指南提供了有效理解和解决类型错误的策略。

## 通用策略

### 1. 从下往上阅读错误

TypeScript 从上往下输出错误，但真正的原因通常在底部：

```
Type '{ name: string; }' is not assignable to type 'User'.
  Types of property 'email' are incompatible.
    Type 'undefined' is not assignable to type 'string'.
                                                ^^^^^^
                                              实际问题在这里！
```

### 2. 悬停查看类型信息

善用 IDE 的悬停提示：

```typescript
const result = someFunction(arg);
//    ^ 悬停这里查看推断的类型
```

### 3. 使用跳转到定义

跳转到类型定义以了解期望的类型：

```typescript
document.querySelector("body");
//       ^ 跳转到定义查看重载
```

### 4. 创建测试类型

提取复杂类型的各个部分来理解它们：

```typescript
// 复杂表达式
type Result = SomeComplexType<Input>[keyof Input][number];

// 分解查看
type Step1 = SomeComplexType<Input>;
type Step2 = Step1[keyof Input];
type Step3 = Step2[number];
```

## 常见错误模式

### "Type 'X' is not assignable to type 'Y'"

最常见的错误。检查：
1. 是否缺少属性？
2. 属性类型是否不兼容？
3. 是否存在字面量 vs 放宽类型的不匹配？

```typescript
// 示例：字面量类型不匹配
const status = "active"; // 类型：string（已放宽）
function setStatus(s: "active" | "inactive") {}
setStatus(status); // 报错！

// 修复：使用 as const
const status = "active" as const; // 类型："active"
setStatus(status); // 正确
```

### "Property 'X' does not exist on type 'Y'"

类型上不存在期望的属性：

```typescript
// 检查 1：类型是否正确？
function process(data: unknown) {
  data.name; // 报错：'name' 不存在于 'unknown'
}

// 修复：添加类型守卫
function process(data: unknown) {
  if (typeof data === "object" && data !== null && "name" in data) {
    data.name; // 正确
  }
}
```

### "Type 'X' cannot be used to index type 'Y'"

尝试访问可能不存在的属性：

```typescript
function getValue<T>(obj: T, key: string) {
  return obj[key]; // 报错：string 不能索引 T
}

// 修复：约束 key
function getValue<T, K extends keyof T>(obj: T, key: K) {
  return obj[key]; // 正确
}
```

### "Argument of type 'X' is not assignable to parameter of type 'Y'"

函数参数类型不匹配：

```typescript
// 通常发生在更窄的函数签名上
const items = ["a", "b", "c"] as const;
items.includes(someString);
// 报错：'string' 不可赋值给 '"a" | "b" | "c"'

// 修复：适当断言
(items as readonly string[]).includes(someString);
```

### "Type 'X' is not generic"

试图向非泛型类型传递类型参数：

```typescript
type NotGeneric = string;
type Attempt = NotGeneric<number>; // 报错！

// 检查是否需要添加泛型参数
type IsGeneric<T> = T;
type Works = IsGeneric<number>; // 正确
```

### 泛型约束错误

```typescript
function process<T>(items: Parameters<T>) {}
// 报错：'T' 不满足约束 '(...args: any) => any'

// 修复：添加约束
function process<T extends (...args: any) => any>(items: Parameters<T>) {}
```

## 调试技巧

### 1. 简化代码

逐步移除复杂度直到错误清晰：

```typescript
// 引起错误的复杂链式调用
const result = complexFunction()
  .map(transform)
  .filter(predicate)
  .reduce(accumulator);

// 简化以隔离问题
const step1 = complexFunction();
// 检查：step1 是你期望的吗？

const step2 = step1.map(transform);
// 检查：step2 是你期望的吗？
// 继续直到找到问题
```

### 2. 添加显式类型注解

强制 TypeScript 告诉你哪里出了问题：

```typescript
// 之前：错误在某处
const result = getData().process();

// 之后：显式注解揭示问题
const data: ExpectedDataType = getData(); // 如果 getData 返回错误类型会报错
const result: ExpectedResultType = data.process(); // 如果 process 返回错误类型会报错
```

### 3. 使用 `// @ts-expect-error` 确认理解

```typescript
// 如果你认为这里应该报错：
// @ts-expect-error - string 不可赋值给 number
const x: number = "hello";

// 如果 @ts-expect-error 未使用，TypeScript 会告诉你
// 说明代码实际上是合法的
```

### 4. 检查源定义

对于库的类型，检查实际定义：

```typescript
// 在 lib.dom.d.ts 中
interface Document {
  querySelector<K extends keyof HTMLElementTagNameMap>(
    selectors: K
  ): HTMLElementTagNameMap[K] | null;
  querySelector(selectors: string): Element | null;
}
```

## 超长错误信息

### 策略：找到核心问题

长错误通常只有一个核心问题：

```
Type '{ fullName: string; id: string; firstName: string; lastName: string; age: number; }'
is not assignable to type
'{ fullName: string; id: string; firstName: string; lastName: string; age: number; agePlus10: number }'.

Property 'agePlus10' is missing in type
'{ fullName: string; id: string; firstName: string; lastName: string; age: number; }'
but required in type '{ fullName: string; agePlus10: number; }'.
                                         ^^^^^^^^^
                                        实际问题在这里！
```

### 策略：使用类型别名

创建类型别名来理解比较：

```typescript
type Actual = typeof problematicValue;
type Expected = ExpectedType;

// 现在悬停查看这两个类型来对比
```

## 调查库的类型

### 查找类型定义

1. 在 import 上跳转到定义
2. 检查 `node_modules/@types/[library]`
3. 检查 `node_modules/[library]/dist/*.d.ts`

### 理解重载

在提示中查看 `(+N overload)`：

```typescript
document.addEventListener("click", handler);
//       ^ 显示 (+1 overload)

// 跳转到定义查看所有重载
// 使用第一个匹配的重载
```

## 类型与实际不符

有时库的类型是错误或不完整的：

### 方案 1：类型断言

```typescript
// 当你比 TypeScript 更了解时
const element = document.getElementById("root") as HTMLDivElement;
```

### 方案 2：声明合并

```typescript
// 扩展已有类型
declare module "some-library" {
  interface SomeType {
    missingProperty: string;
  }
}
```

### 方案 3：报告问题

- 在 GitHub 上检查是否是已知问题
- 提交带复现的 bug 报告
- 可能的话提交修复

## 预防策略

### 1. 启用严格模式

```json
{
  "compilerOptions": {
    "strict": true
  }
}
```

### 2. 避免使用 `any`

每个 `any` 都是潜在的类型漏洞：

```typescript
// 不要用
const data: any = fetchData();

// 用 unknown
const data: unknown = fetchData();
// 然后用类型守卫缩窄
```

### 3. 使用正确的泛型

```typescript
// 不要在泛型中使用 any
function wrap<T = any>(value: T) {}

// 适当约束
function wrap<T extends object>(value: T) {}
```

### 4. 测试边界情况

```typescript
// 考虑可能传入的值
function process(input: string | string[]) {
  // 如果 input 是空字符串？
  // 如果 input 是空数组？
  // 如果 input 包含特殊字符？
}
```

## IDE 技巧

1. **使用 TypeScript 版本选择器**：匹配项目版本
2. **启用内联提示**：在行内查看推断类型
3. **使用快速修复**：通常会建议正确的解决方案
4. **查看问题面板**：一次查看所有错误
5. **使用重命名符号**：安全地跨文件重命名类型
