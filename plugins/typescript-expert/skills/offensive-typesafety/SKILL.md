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

- 把 `as any` 当作项目级解决方案，而不是局部逃生舱口。
- 前端/后端/数据库分别维护三套近似类型，靠人工记忆保持同步。
- 只写静态类型不做运行时解析，直接相信 URL、表单、第三方 API 输入。
- 用字符串路由、字符串事件名、字符串字段路径驱动关键流程。
- 把类型安全理解成“多写几层 interface”，却不让编译器真正参与边界约束。
