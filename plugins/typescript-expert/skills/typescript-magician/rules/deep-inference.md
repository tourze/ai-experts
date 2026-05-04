---
name: deep-inference
description: 使用 F.Narrow 和 as const 实现深层类型推断
metadata:
  tags: inference, narrow, deep-inference, ts-toolbelt
---

# 深层类型推断

## 概述

默认情况下，TypeScript 在推断对象和数组时会放宽类型。对于高级类型安全 API，通常需要在嵌套结构中深层保留字面量类型。本文档介绍实现深层推断的技术。

## 问题：类型放宽

```typescript
const makeRouter = <TConfig>(config: TConfig) => {
  return { config };
};

const router = makeRouter({
  "/": {},
  "/search": {
    search: ["query", "page"],
  },
});

// TConfig 被推断为：
// {
//   "/": {};
//   "/search": {
//     search: string[]; // 不是 ["query", "page"]！
//   };
// }
```

字面量元组 `["query", "page"]` 被放宽为 `string[]`，丢失了类型信息。

## 方案 1：用户手动添加 `as const`

要求用户添加 `as const`：

```typescript
const router = makeRouter({
  "/": {},
  "/search": {
    search: ["query", "page"],
  },
} as const);

// 现在 TConfig 保留了字面量：
// {
//   readonly "/": {};
//   readonly "/search": {
//     readonly search: readonly ["query", "page"];
//   };
// }
```

### 缺点
- 用户必须记得添加 `as const`
- 类型变为 readonly（可能需要类型调整）
- 容易遗忘，导致隐蔽的 bug

## 方案 2：ts-toolbelt 的 F.Narrow

`ts-toolbelt` 库提供 `F.Narrow` 用于自动深层缩窄：

```typescript
import { F } from "ts-toolbelt";

const makeRouter = <TConfig extends BaseRouterConfig>(
  config: F.Narrow<TConfig>
) => {
  return { config };
};

const router = makeRouter({
  "/": {},
  "/search": {
    search: ["query", "page"],
  },
});

// TConfig 现在是：
// {
//   "/": {};
//   "/search": {
//     search: ["query", "page"]; // 字面量元组已保留！
//   };
// }
```

### F.Narrow 的工作原理

`F.Narrow` 递归地将类型缩窄为其字面量形式：
- 字符串变为字面量字符串类型
- 数字变为字面量数字类型
- 数组变为元组
- 对象的属性被缩窄

## 方案 3：自定义 Narrow 类型

如果无法使用 ts-toolbelt，可以简化实现：

```typescript
type Narrow<T> = T extends Function
  ? T
  : T extends []
  ? []
  : T extends readonly [infer First, ...infer Rest]
  ? [Narrow<First>, ...Narrow<Rest>]
  : T extends object
  ? { [K in keyof T]: Narrow<T[K]> }
  : T;

// 注意：这是简化版，可能未覆盖所有边界情况
```

## 实际示例：类型安全路由器

```typescript
import { F } from "ts-toolbelt";

type BaseRouterConfig = Record<string, { search?: string[] }>;

type TupleToSearchParams<T extends string[]> = {
  [K in T[number]]?: string;
};

const makeRouter = <TConfig extends BaseRouterConfig>(
  config: F.Narrow<TConfig>
) => {
  return {
    config,
    goTo: <TRoute extends keyof TConfig>(
      route: TRoute,
      search?: TConfig[TRoute]["search"] extends string[]
        ? TupleToSearchParams<TConfig[TRoute]["search"]>
        : never
    ) => {
      // 实现
    },
  };
};

const router = makeRouter({
  "/": {},
  "/dashboard": {
    search: ["page", "perPage", "sort"],
  },
});

// 完全类型安全！
router.goTo("/dashboard", {
  page: "1",
  perPage: "10",
  sort: "name", // 必须是已定义的搜索参数之一
});

// 报错："invalid" 不是有效的搜索参数
router.goTo("/dashboard", { invalid: "value" });
```

## 方案 4：const 类型参数（TypeScript 5.0+）

TypeScript 5.0 引入了 `const` 类型参数：

```typescript
const makeRouter = <const TConfig extends BaseRouterConfig>(
  config: TConfig
) => {
  return { config };
};

// TConfig 自动像 as const 一样缩窄
const router = makeRouter({
  "/": {},
  "/search": {
    search: ["query", "page"],
  },
});
```

### `const` 类型参数的优势
- 无需外部库
- TypeScript 内置
- 语法简洁
- 支持约束

## 深层推断的适用场景

### 配置对象

```typescript
const createTheme = <const TTheme extends Record<string, string>>(
  theme: TTheme
): TTheme => theme;

const theme = createTheme({
  primary: "#0066cc",
  secondary: "#666666",
});

// theme.primary 是 "#0066cc"，不是 string
```

### 路由定义

```typescript
const routes = defineRoutes({
  home: { path: "/" },
  user: { path: "/users/:id" },
  post: { path: "/posts/:postId" },
});

// 路由名和路径都是字面量类型
```

### 事件系统

```typescript
const events = createEventMap({
  click: (x: number, y: number) => {},
  keydown: (key: string) => {},
});

// 事件名是字面量联合，处理函数有正确类型
```

## 技术对比

| 技术 | 优点 | 缺点 |
|------|------|------|
| `as const` | 无依赖 | 需手动添加，类型变 readonly |
| `F.Narrow` | 自动、灵活 | 外部依赖 |
| 自定义 Narrow | 无依赖、可定制 | 复杂，可能遗漏边界情况 |
| `const` 类型参数 | 内置、语法简洁 | 需要 TypeScript 5.0+ |

## 与条件类型结合

深层推断支持强大的条件类型逻辑：

```typescript
import { F } from "ts-toolbelt";

const makeApi = <const TConfig extends Record<string, { returns: string }>>(
  config: TConfig
) => {
  return {
    call: <TMethod extends keyof TConfig>(
      method: TMethod
    ): TConfig[TMethod]["returns"] => {
      // 实现
      return "" as any;
    },
  };
};

const api = makeApi({
  getUser: { returns: "User" },
  getPost: { returns: "Post" },
});

const user = api.call("getUser"); // 类型："User"
const post = api.call("getPost"); // 类型："Post"
```

## 常见陷阱

### 忘记添加约束

```typescript
// 没有约束时，F.Narrow 没有基础类型可以工作
const bad = <TConfig>(config: F.Narrow<TConfig>) => config;

// 有约束时，推断才能正确工作
const good = <TConfig extends Record<string, unknown>>(
  config: F.Narrow<TConfig>
) => config;
```

### 只读数组

使用 `as const` 时，数组变为 `readonly`：

```typescript
const config = {
  values: [1, 2, 3],
} as const;

// config.values 是 readonly [1, 2, 3]
config.values.push(4); // 报错：类型 'readonly [1, 2, 3]' 上不存在属性 'push'
```

### 深层嵌套性能

极深层嵌套的类型可能拖慢编译器：

```typescript
// 极深层嵌套可能导致性能问题
type DeepConfig = {
  level1: {
    level2: {
      level3: {
        // ... 更多层级
      };
    };
  };
};
```

## 最佳实践

1. 尽可能使用 `const` 类型参数（TypeScript 5.0+）
2. 复杂推断需求回退到 `F.Narrow`
3. 简单的用户配置考虑用 `as const`
4. 添加适当的约束引导推断
5. 用复杂示例测试推断是否正确
6. 为 API 使用者记录推断行为
