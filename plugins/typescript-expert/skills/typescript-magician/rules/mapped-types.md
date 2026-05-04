---
name: mapped-types
description: 通过变换现有类型的属性创建新类型
metadata:
  tags: mapped-types, key-remapping, property-modifiers, index-signatures
---

# 映射类型

## 概述

映射类型允许通过变换现有类型的每个属性来创建新类型。它们遍历键并应用变换，创建新的类型结构。

## 基本语法

```typescript
type MappedType<T> = {
  [K in keyof T]: TransformedType;
};
```

## 简单示例

### 将所有属性变为可选

```typescript
type MyPartial<T> = {
  [K in keyof T]?: T[K];
};

interface User {
  id: string;
  name: string;
  email: string;
}

type PartialUser = MyPartial<User>;
// { id?: string; name?: string; email?: string }
```

### 将所有属性变为必需

```typescript
type MyRequired<T> = {
  [K in keyof T]-?: T[K]; // -? 移除可选修饰符
};
```

### 将所有属性变为只读

```typescript
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};
```

### 将所有属性变为可变

```typescript
type Mutable<T> = {
  -readonly [K in keyof T]: T[K]; // -readonly 移除 readonly 修饰符
};
```

## 保留原始键

直接遍历 `keyof T` 时，保留原始键：

```typescript
type Preserve<T> = {
  [K in keyof T]: T[K]; // 相同类型，只是重建
};
```

## 使用 `as` 进行键重映射

在映射时通过 `as` 子句变换键：

```typescript
type RemapKeys<T> = {
  [K in keyof T as NewKeyType]: T[K];
};
```

### 为键添加前缀

```typescript
type Prefixed<T, P extends string> = {
  [K in keyof T as K extends string ? `${P}${K}` : K]: T[K];
};

interface User {
  name: string;
  age: number;
}

type PrefixedUser = Prefixed<User, "user_">;
// { user_name: string; user_age: number }
```

### 通过重映射为 `never` 移除键

```typescript
type RemoveFields<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};

type UserWithoutEmail = RemoveFields<User, "email">;
// { id: string; name: string }
```

### 变换键

```typescript
type RemoveMapsPrefixFromObj<T> = {
  [K in keyof T as RemoveMaps<K>]: T[K];
};

type RemoveMaps<T> = T extends `maps:${infer Rest}` ? Rest : T;

interface ApiData {
  "maps:longitude": string;
  "maps:latitude": string;
}

type CleanData = RemoveMapsPrefixFromObj<ApiData>;
// { longitude: string; latitude: string }
```

## 过滤键

在 `as` 子句中使用条件类型进行过滤：

```typescript
// 仅保留字符串属性
type OnlyStrings<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

interface Mixed {
  name: string;
  age: number;
  email: string;
  active: boolean;
}

type StringProps = OnlyStrings<Mixed>;
// { name: string; email: string }
```

### 仅保留必需属性

```typescript
type RequiredKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? never : K;
}[keyof T];

type OnlyRequired<T> = Pick<T, RequiredKeys<T>>;
```

### 仅保留可选属性

```typescript
type OptionalKeys<T> = {
  [K in keyof T]-?: undefined extends T[K] ? K : never;
}[keyof T];

type OnlyOptional<T> = Pick<T, OptionalKeys<T>>;
```

## 变换属性类型

### 将所有属性包装为 Promise

```typescript
type Promisify<T> = {
  [K in keyof T]: Promise<T[K]>;
};

interface SyncApi {
  getUser(): User;
  getPost(): Post;
}

type AsyncApi = Promisify<SyncApi>;
// { getUser: Promise<() => User>; getPost: Promise<() => Post> }
```

### 将所有属性变为数组

```typescript
type Arrayify<T> = {
  [K in keyof T]: T[K][];
};

interface Single {
  name: string;
  count: number;
}

type Multiple = Arrayify<Single>;
// { name: string[]; count: number[] }
```

### 可空属性

```typescript
type Nullable<T> = {
  [K in keyof T]: T[K] | null;
};
```

## 深层映射类型

递归应用变换：

```typescript
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K];
};

interface Nested {
  user: {
    profile: {
      name: string;
    };
  };
}

type ReadonlyNested = DeepReadonly<Nested>;
// 所有层级都是 readonly
```

### 深层 Partial

```typescript
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};
```

## 实际示例

### Getter 和 Setter

```typescript
type Getters<T> = {
  [K in keyof T as `get${Capitalize<string & K>}`]: () => T[K];
};

type Setters<T> = {
  [K in keyof T as `set${Capitalize<string & K>}`]: (value: T[K]) => void;
};

interface Person {
  name: string;
  age: number;
}

type PersonGetters = Getters<Person>;
// { getName: () => string; getAge: () => number }

type PersonSetters = Setters<Person>;
// { setName: (value: string) => void; setAge: (value: number) => void }
```

### 事件处理函数

```typescript
type EventHandlers<T> = {
  [K in keyof T as `on${Capitalize<string & K>}Change`]: (
    newValue: T[K],
    oldValue: T[K]
  ) => void;
};

interface State {
  count: number;
  name: string;
}

type StateHandlers = EventHandlers<State>;
// {
//   onCountChange: (newValue: number, oldValue: number) => void;
//   onNameChange: (newValue: string, oldValue: string) => void;
// }
```

### 表单验证错误

```typescript
type ValidationErrors<T> = {
  [K in keyof T]?: string[];
};

interface RegistrationForm {
  email: string;
  password: string;
  confirmPassword: string;
}

type RegistrationErrors = ValidationErrors<RegistrationForm>;
// { email?: string[]; password?: string[]; confirmPassword?: string[] }
```

## 组合映射类型

### 选取并变换

```typescript
type PickAndTransform<T, K extends keyof T> = {
  [P in K]: T[P] extends Function ? T[P] : Readonly<T[P]>;
};
```

### 合并两个类型

```typescript
type Merge<A, B> = {
  [K in keyof A | keyof B]: K extends keyof B
    ? B[K]
    : K extends keyof A
    ? A[K]
    : never;
};
```

## 映射类型中的索引签名

```typescript
// 从联合类型创建索引签名
type FromUnion<K extends string, V> = {
  [P in K]: V;
};

type Dict = FromUnion<"a" | "b" | "c", number>;
// { a: number; b: number; c: number }
```

## 常见陷阱

### 忘记字符串键检查

模板字面量需要字符串键：

```typescript
// 报错：类型 'K' 不可赋值给类型 'string'
type Wrong<T> = {
  [K in keyof T as `prefix_${K}`]: T[K];
};

// 正确：检查 K extends string
type Correct<T> = {
  [K in keyof T as K extends string ? `prefix_${K}` : never]: T[K];
};
```

### 丢失修饰符

重映射可能丢失可选/只读修饰符：

```typescript
// 原始可选修饰符丢失
type Transform<T> = {
  [K in keyof T as `new_${string & K}`]: T[K];
};

// 用条件类型保留可选
type TransformPreserve<T> = {
  [K in keyof T as `new_${string & K}`]+?: T[K];
};
```

### 无限递归

深层映射类型可能导致问题：

```typescript
// 循环类型可能导致无限递归
type DeepReadonly<T> = {
  readonly [K in keyof T]: DeepReadonly<T[K]>;
};

// 为原始类型添加基础情况
type DeepReadonlySafe<T> = T extends object
  ? { readonly [K in keyof T]: DeepReadonlySafe<T[K]> }
  : T;
```

## 何时使用映射类型

- **类型变换**：改变修饰符（可选、只读）
- **键重命名**：添加前缀、后缀或变换键名
- **属性过滤**：移除或保留特定属性
- **批量操作**：对所有属性应用相同变换
- **类型工具**：构建可复用的类型变换器
