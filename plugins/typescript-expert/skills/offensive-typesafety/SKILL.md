---
name: offensive-typesafety
description: 在搭建新的 TypeScript 技术栈、设计路由/API/数据库边界，或把字符串协议升级为编译器可验证合同的时候使用。
---

# Offensive Typesafety

## 适用场景

- 需要为新项目选型，决定路由、表单、服务端接口、数据库模型如何共享同一份合同。
- 现有代码大量依赖字符串键、隐式约定、`as any` 或弱类型 DTO，需要收口成可重构的边界。
- 多人协作或 AI 生成代码时，要求“拼错即编译失败”，而不是“上线后才发现字段不对”。
- 需要补强复杂泛型、类型提取或工具类型细节时，联动 [typescript-magician](../typescript-magician/SKILL.md)。
- 需要系统整理条件类型、映射类型与模板字面量能力时，联动 [typescript-advanced-types](../typescript-advanced-types/SKILL.md)。

## 核心约束

- 所有外部边界先定义合同，再写业务逻辑：路由参数、URL search、API payload、数据库行、消息体都算边界。
- 编译器报错优先于“代码看起来像对的”；不要靠注释、口头约定或 README 维持协议同步。
- 运行时校验与静态类型必须成对出现：静态类型负责开发期约束，运行时解析负责不可信输入落地。
- 所有逃生舱口都要局部化：`as any`、双重断言、宽松索引访问只能出现在最外层适配器，不能扩散进业务核心。
- 同一个领域对象只能有一个 canonical contract；前端 DTO、后端返回、数据库模型不能各写一份互相漂移的“近似类型”。

## 代码模式

### 1. 路由参数不要再靠字符串拼接

```ts
const ROUTES = {
  userDetail: "/users/:userId",
  teamSettings: "/teams/:teamId/settings",
} as const;

type RouteParams = {
  userDetail: { userId: string };
  teamSettings: { teamId: string; tab: "profile" | "billing" };
};

function buildPath(name: "userDetail", params: RouteParams["userDetail"]): string;
function buildPath(name: "teamSettings", params: RouteParams["teamSettings"]): string;
function buildPath(
  name: keyof typeof ROUTES,
  params: RouteParams[keyof RouteParams],
): string {
  if (name === "userDetail" && "userId" in params) {
    return `/users/${params.userId}`;
  }

  if (name === "teamSettings" && "teamId" in params) {
    return `/teams/${params.teamId}/settings?tab=${params.tab}`;
  }

  throw new Error(`Unknown route: ${name}`);
}

const nextUrl = buildPath("teamSettings", {
  teamId: "team-42",
  tab: "billing",
});

if (!nextUrl.includes("billing")) {
  throw new Error("route contract drift");
}
```

### 2. 不可信输入先解析成稳定对象，再进入业务层

```ts
type SearchInput = Record<string, string | undefined>;
type UserSearch = {
  tab: "profile" | "settings";
  page: number;
};

function parseUserSearch(input: SearchInput): UserSearch {
  const tab = input.tab === "settings" ? "settings" : "profile";
  const page = Number.parseInt(input.page ?? "1", 10);

  return {
    tab,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

const search = parseUserSearch({ tab: "settings", page: "2" });
if (search.page !== 2 || search.tab !== "settings") {
  throw new Error("search parser drift");
}
```

### 3. DTO 变换要显式，禁止“差不多长这样”

```ts
type UserRow = {
  id: string;
  email: string;
  isActive: boolean;
};

type UserDto = {
  id: string;
  email: string;
  status: "active" | "inactive";
};

function toUserDto(row: UserRow): UserDto {
  return {
    id: row.id,
    email: row.email,
    status: row.isActive ? "active" : "inactive",
  };
}

const dto = toUserDto({
  id: "user-1",
  email: "ada@example.com",
  isActive: true,
});

if (dto.status !== "active") {
  throw new Error("dto contract drift");
}
```

## 检查清单

- 每个外部边界是否都有“运行时解析 + 静态类型”双重约束？
- 路由、查询参数、API payload 是否仍在用裸字符串和手写对象拼装？
- DTO 变换是否集中在适配器层，而不是在 UI / Service / Repository 到处散落？
- 类型定义是否由单一源头推导，而不是前后端、测试、文档各写一份？
- AI 或新同事改字段名后，是否能在编译期立刻暴露影响面？

## 反模式

### FAIL: 三套近似类型

```ts
// frontend: type User = { id: string; isActive: boolean }
// backend:  interface UserDto { id: string; status: 'active' | 'inactive' }
// db:       CREATE TABLE users (id uuid, is_active boolean)
// 三处不一致 → bug 永远在边界出现
```

### PASS: 单一 schema 推导

```ts
type ZString = { kind: "string"; uuid: () => ZString };
type ZBoolean = { kind: "boolean" };
type ZObject<T extends Record<string, unknown>> = { kind: "object"; shape: T };

const z = {
  string(): ZString {
    return { kind: "string", uuid() { return this; } };
  },
  boolean(): ZBoolean {
    return { kind: "boolean" };
  },
  object<T extends Record<string, unknown>>(shape: T): ZObject<T> {
    return { kind: "object", shape };
  },
};

type InferSchema<T> = T extends ZObject<infer S>
  ? {
      [K in keyof S]:
        S[K] extends ZString ? string :
        S[K] extends ZBoolean ? boolean :
        never;
    }
  : never;

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  isActive: z.boolean(),
});

export type User = InferSchema<typeof UserSchema>;

const sampleUser: User = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  name: "Ada",
  isActive: true,
};

if (UserSchema.shape.id.kind !== "string" || !sampleUser.isActive) {
  throw new Error("schema contract drift");
}
// 前后端共用 → 改一处全部跟随
```

### FAIL: 只静态不运行时

```ts
const rawData = { id: "user-1", status: "active" };
const data: UserDto = rawData as UserDto;
// 服务端改字段，前端类型系统不知道，运行时静默错位
```

### PASS: 边界处运行时校验

```ts
type UserDto = {
  id: string;
  status: "active" | "inactive";
};

function parseUserDto(input: unknown): UserDto {
  if (
    typeof input === "object" &&
    input !== null &&
    typeof (input as { id?: unknown }).id === "string" &&
    ((input as { status?: unknown }).status === "active" ||
      (input as { status?: unknown }).status === "inactive")
  ) {
    return input as UserDto;
  }

  throw new Error("invalid user payload");
}

const rawData: unknown = { id: "user-1", status: "active" };
const data = parseUserDto(rawData);
// 不符合立即抛错，业务层拿到的永远合法
```
