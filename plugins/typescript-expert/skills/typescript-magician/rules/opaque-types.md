---
name: opaque-types
description: 品牌类型与不透明类型，用于类型安全的标识符
metadata:
  tags: opaque-types, brand-types, nominal-typing, type-safety
---

# 不透明类型（品牌类型）

## 概述

不透明类型（也叫品牌类型或名义类型）从原始类型创建独立类型，防止混用底层类型相同但语义不同的值。

## 问题

TypeScript 使用结构化类型，所以以下类型可以互换：

```typescript
type UserId = string;
type PostId = string;

function getUser(id: UserId): User { /* ... */ }
function getPost(id: PostId): Post { /* ... */ }

const userId: UserId = "user-123";
const postId: PostId = "post-456";

// BUG：ID 类型错误，但 TypeScript 允许！
getUser(postId); // 不报错 - 两者都只是 string
```

## 创建不透明类型

添加幽灵属性创建名义区分：

```typescript
type Opaque<TValue, TBrand> = TValue & { __brand: TBrand };

type UserId = Opaque<string, "UserId">;
type PostId = Opaque<string, "PostId">;
type ValidEmail = Opaque<string, "ValidEmail">;
type ValidAge = Opaque<number, "ValidAge">;
```

现在这些类型互不兼容：

```typescript
function getUser(id: UserId): User { /* ... */ }
function getPost(id: PostId): Post { /* ... */ }

const userId = "user-123" as UserId;
const postId = "post-456" as PostId;

getUser(userId); // 正确
getUser(postId); // 报错：类型 'PostId' 不可赋值给类型 'UserId'
```

## 用类型谓词进行验证

使用类型谓词验证并缩窄类型：

```typescript
type ValidEmail = Opaque<string, "ValidEmail">;

// 类型谓词："email is ValidEmail" 缩窄类型
const isValidEmail = (email: string): email is ValidEmail => {
  return email.includes("@") && email.includes(".");
};

// 使用类型缩窄
function processEmail(email: string): void {
  if (!isValidEmail(email)) {
    throw new Error("Invalid email");
  }

  // email 现在是 ValidEmail
  sendEmail(email); // 类型安全！
}

function sendEmail(email: ValidEmail): void {
  // 我们知道 email 已通过验证
}
```

## 断言函数

断言函数在输入无效时抛出异常并缩窄类型：

```typescript
type ValidEmail = Opaque<string, "ValidEmail">;

// 断言函数 - 必须用 function 声明，不能用箭头函数
function assertValidEmail(email: string): asserts email is ValidEmail {
  if (!email.includes("@") || !email.includes(".")) {
    throw new Error("Invalid email format");
  }
}

// 使用
async function createUser(data: { email: string }): Promise<User> {
  assertValidEmail(data.email);

  // data.email 现在是 ValidEmail
  return await saveUser({
    email: data.email, // 类型安全！
  });
}
```

## 重要：断言函数语法

断言函数**必须**使用 `function` 关键字声明，不能用箭头函数：

```typescript
// 错误 - 箭头函数不支持 asserts
const assertValidEmail = (email: string): asserts email is ValidEmail => {
  // 报错：Assertions require every name in the call target to be
  // declared with an explicit type annotation.
};

// 正确 - 使用 function 声明
function assertValidEmail(email: string): asserts email is ValidEmail {
  if (!email.includes("@")) {
    throw new Error("Invalid email");
  }
}
```

## 对比：类型谓词 vs 断言函数

| 方面 | 类型谓词 | 断言函数 |
|------|---------|---------|
| 返回值 | `boolean` | `void`（失败时抛出） |
| 使用方式 | 在 `if` 语句中 | 独立调用 |
| 错误处理 | 调用方处理 | 函数内部抛出 |
| 语法 | 箭头函数或 function | 必须用 `function` |

```typescript
// 类型谓词 - 返回 boolean，调用方处理失败
if (!isValidEmail(email)) {
  return { error: "Invalid email" };
}
sendEmail(email);

// 断言函数 - 抛出异常，快乐路径更简洁
assertValidEmail(email);
sendEmail(email);
```

## 完整示例：用户注册

```typescript
type Opaque<TValue, TBrand> = TValue & { __brand: TBrand };

type ValidEmail = Opaque<string, "ValidEmail">;
type ValidPassword = Opaque<string, "ValidPassword">;
type UserId = Opaque<string, "UserId">;

// 验证函数
function assertValidEmail(email: string): asserts email is ValidEmail {
  if (!email.includes("@") || email.length < 5) {
    throw new Error("Invalid email format");
  }
}

function assertValidPassword(password: string): asserts password is ValidPassword {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }
}

// 数据库函数要求已验证的类型
async function createUser(data: {
  email: ValidEmail;
  password: ValidPassword;
}): Promise<{ id: UserId }> {
  // 我们知道 email 和 password 已通过验证
  return { id: crypto.randomUUID() as UserId };
}

// API 处理
async function handleRegistration(input: { email: string; password: string }) {
  // 调用 createUser 前必须先验证
  assertValidEmail(input.email);
  assertValidPassword(input.password);

  // 现在可以安全调用 createUser
  const user = await createUser({
    email: input.email,
    password: input.password,
  });

  return user;
}
```

## 模式：不透明类型的工厂函数

在创建时进行验证：

```typescript
type UserId = Opaque<string, "UserId">;

// 验证并创建的工厂函数
function createUserId(id: string): UserId {
  if (!id.startsWith("user_")) {
    throw new Error("Invalid user ID format");
  }
  return id as UserId;
}

// 或使用类型谓词进行条件创建
function parseUserId(id: string): UserId | null {
  if (!id.startsWith("user_")) {
    return null;
  }
  return id as UserId;
}
```

## 何时使用不透明类型

- **ID**：UserId、PostId、OrderId - 防止混用不同实体的 ID
- **已验证字符串**：Email、URL、Phone - 确保已通过验证
- **已验证数字**：Age、Price、Quantity - 确保范围验证
- **安全敏感**：HashedPassword、APIKey - 防止意外暴露

## 常见陷阱

### 直接赋值绕过类型安全

```typescript
const email: ValidEmail = "invalid"; // 编译时报错

// 但类型断言可以绕过安全检查
const email = "invalid" as ValidEmail; // 不报错，但可能是错误的！
```

### 忘记验证

```typescript
function processUser(userId: UserId): void {
  // ...
}

// 错误 - 未验证就断言
processUser(request.body.id as UserId);

// 正确 - 先验证
function assertUserId(id: string): asserts id is UserId {
  if (!id.startsWith("user_")) throw new Error("Invalid user ID");
}

assertUserId(request.body.id);
processUser(request.body.id);
```

## 替代方案：unique symbol 品牌

使用 unique symbol 的更健壮品牌方案：

```typescript
declare const brand: unique symbol;

type Brand<T, TBrand> = T & { [brand]: TBrand };

type UserId = Brand<string, "UserId">;
type PostId = Brand<string, "PostId">;

// 这稍微更类型安全，因为 __brand 理论上可能是真实属性，
// 但 unique symbol 不会
```
