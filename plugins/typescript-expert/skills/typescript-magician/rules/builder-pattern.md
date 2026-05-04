---
name: builder-pattern
description: 类型安全的建造者模式与链式调用
metadata:
  tags: builder-pattern, fluent-api, chaining, generics-in-classes
---

# 类型安全的建造者模式

## 概述

建造者模式通过一系列链式方法调用逐步构建数据结构或配置。在 TypeScript 中，可以在类型层面追踪累积状态，使该模式完全类型安全。

## 基本概念

每个方法返回一个带有更新类型信息的新建造者：

```typescript
new DbSeeder()
  .addUser("matt", { name: "Matt" })
  .addPost("post1", { title: "Hello" })
  .transact();
// 每一步都更新类型以包含新增的内容
```

## 实现模式

### 第 1 步：定义基础类型

```typescript
interface User {
  id: string;
  name: string;
}

interface Post {
  id: string;
  title: string;
  authorId: string;
}

// 约束泛型的数据形状
interface DbShape {
  users: Record<string, User>;
  posts: Record<string, Post>;
}
```

### 第 2 步：创建泛型建造者

```typescript
export class DbSeeder<TDatabase extends DbShape> {
  public users: DbShape["users"] = {};
  public posts: DbShape["posts"] = {};

  // 每个方法返回扩展了类型信息的 DbSeeder
  addUser = <Id extends string>(
    id: Id,
    user: Omit<User, "id">,
  ): DbSeeder<TDatabase & { users: TDatabase["users"] & Record<Id, User> }> => {
    this.users[id] = { ...user, id };
    return this;
  };

  addPost = <Id extends string>(
    id: Id,
    post: Omit<Post, "id">,
  ): DbSeeder<TDatabase & { posts: TDatabase["posts"] & Record<Id, Post> }> => {
    this.posts[id] = { ...post, id };
    return this;
  };

  // 终端方法返回具有正确类型的构建结果
  transact = async () => {
    // 实际的数据库操作放在这里
    return {
      users: this.users as TDatabase["users"],
      posts: this.posts as TDatabase["posts"],
    };
  };
}
```

### 第 3 步：使用类型推断

```typescript
const usage = async () => {
  const result = await new DbSeeder()
    .addUser("matt", { name: "Matt" })
    .addPost("post1", { authorId: "matt", title: "Hello" })
    .addPost("post2", { authorId: "matt", title: "World" })
    .transact();

  // result.users.matt 类型为 User
  // result.posts.post1 类型为 Post
  // result.posts.post2 类型为 Post

  console.log(result.users.matt.name); // 类型安全！
  console.log(result.posts.post1.title); // 类型安全！
};
```

## 类型如何逐步累积

每次方法调用都扩展类型：

```typescript
new DbSeeder()
// 类型：DbSeeder<{ users: {}; posts: {} }>

.addUser("matt", { name: "Matt" })
// 类型：DbSeeder<{ users: Record<"matt", User>; posts: {} }>

.addPost("post1", { ... })
// 类型：DbSeeder<{ users: Record<"matt", User>; posts: Record<"post1", Post> }>

.addPost("post2", { ... })
// 类型：DbSeeder<{ users: Record<"matt", User>; posts: Record<"post1" | "post2", Post> }>
```

## 关键技巧

### 1. 泛型 ID 捕获

通过使用带 string 约束的泛型捕获字面量类型：

```typescript
addUser = <Id extends string>(
  id: Id, // Id 被推断为字面量类型 "matt"，而非 string
  user: Omit<User, "id">,
): DbSeeder<TDatabase & { users: TDatabase["users"] & Record<Id, User> }>
```

### 2. 交叉类型实现类型累积

使用 `&` 添加新类型信息同时保留已有信息：

```typescript
TDatabase & { users: TDatabase["users"] & Record<Id, User> }
```

### 3. 终端方法中的类型断言

运行时类型与编译时类型不匹配，因此需要在最终方法中断言：

```typescript
transact = async () => {
  return {
    users: this.users as TDatabase["users"],
    posts: this.posts as TDatabase["posts"],
  };
};
```

## 模式：查询构建器

```typescript
interface QueryState {
  table: string | null;
  columns: string[];
  whereClause: string | null;
}

class QueryBuilder<TState extends QueryState> {
  private state: TState;

  private constructor(state: TState) {
    this.state = state;
  }

  static create() {
    return new QueryBuilder({
      table: null,
      columns: [],
      whereClause: null,
    });
  }

  from<T extends string>(
    table: T
  ): QueryBuilder<TState & { table: T }> {
    return new QueryBuilder({ ...this.state, table });
  }

  select<C extends string[]>(
    ...columns: C
  ): QueryBuilder<TState & { columns: C }> {
    return new QueryBuilder({ ...this.state, columns });
  }

  where<W extends string>(
    clause: W
  ): QueryBuilder<TState & { whereClause: W }> {
    return new QueryBuilder({ ...this.state, whereClause: clause });
  }

  // 仅在 table 已设置时允许 build
  build(this: QueryBuilder<TState & { table: string }>): string {
    const cols = this.state.columns.length
      ? this.state.columns.join(", ")
      : "*";
    let sql = `SELECT ${cols} FROM ${this.state.table}`;
    if (this.state.whereClause) {
      sql += ` WHERE ${this.state.whereClause}`;
    }
    return sql;
  }
}

// 使用
const query = QueryBuilder.create()
  .from("users")
  .select("id", "name")
  .where("active = true")
  .build();

// 错误：没有 from() 不能调用 build
QueryBuilder.create().select("id").build(); // 类型错误！
```

## 模式：带必填字段的配置构建器

```typescript
interface ServerConfig {
  host: string;
  port: number;
  ssl?: boolean;
  timeout?: number;
}

type RequiredFields = "host" | "port";
type ConfiguredFields<T> = { [K in keyof T]-?: K };

class ConfigBuilder<TConfigured extends Partial<Record<keyof ServerConfig, true>>> {
  private config: Partial<ServerConfig> = {};

  host(value: string): ConfigBuilder<TConfigured & { host: true }> {
    this.config.host = value;
    return this as any;
  }

  port(value: number): ConfigBuilder<TConfigured & { port: true }> {
    this.config.port = value;
    return this as any;
  }

  ssl(value: boolean): ConfigBuilder<TConfigured & { ssl: true }> {
    this.config.ssl = value;
    return this as any;
  }

  // 仅当必填字段都已设置时才允许 build
  build(
    this: ConfigBuilder<{ host: true; port: true }>
  ): ServerConfig {
    return this.config as ServerConfig;
  }
}

// 使用
const config = new ConfigBuilder()
  .host("localhost")
  .port(3000)
  .ssl(true)
  .build();

// 错误：缺少必填字段
new ConfigBuilder().host("localhost").build(); // 类型错误！
```

## 高级：默认值

```typescript
export class DbSeeder<
  TDatabase extends DbShape = {
    users: { defaultUser: User };
    posts: {};
  }
> {
  public users: DbShape["users"] = {
    defaultUser: { id: "default", name: "Default User" },
  };
  // ...
}

// 每个 DbSeeder 都自带 defaultUser
const seeder = new DbSeeder();
// seeder 默认拥有 users.defaultUser
```

## 何时使用建造者模式

- **复杂对象构建**：多个可选/必填字段
- **流畅 API**：查询、配置、测试数据的 DSL
- **类型层面的验证**：确保必经步骤已完成
- **增量构建**：分步添加后最终确定

## 常见陷阱

### 忘记约束泛型

```typescript
// 错误 - TDatabase 可以是任何类型
class DbSeeder<TDatabase> {
  // 报错：无法访问 TDatabase["users"]
}

// 正确 - 约束为 DbShape
class DbSeeder<TDatabase extends DbShape> {
  // 可以安全访问 TDatabase["users"] 和 TDatabase["posts"]
}
```

### 终端方法中未做类型断言

```typescript
// 错误 - 类型不匹配
transact = async () => {
  return {
    users: this.users, // 类型：Record<string, User>，不是 TDatabase["users"]
    posts: this.posts,
  };
};

// 正确 - 断言为累积的类型
transact = async () => {
  return {
    users: this.users as TDatabase["users"],
    posts: this.posts as TDatabase["posts"],
  };
};
```

### 返回 `this` 而非新类型

```typescript
// 错误 - 返回相同类型，丢失类型信息
addUser(id: string, user: Omit<User, "id">): this {
  return this;
}

// 正确 - 返回新的泛型实例化
addUser<Id extends string>(
  id: Id,
  user: Omit<User, "id">,
): DbSeeder<TDatabase & { users: TDatabase["users"] & Record<Id, User> }> {
  return this;
}
```
