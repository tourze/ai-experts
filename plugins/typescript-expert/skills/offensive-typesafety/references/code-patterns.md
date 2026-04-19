# Offensive Typesafety — Code Patterns

## 1. 路由参数不要再靠字符串拼接

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

## 2. 不可信输入先解析成稳定对象，再进入业务层

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

## 3. DTO 变换要显式，禁止"差不多长这样"

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

## 4. 单一 schema 推导（PASS: 替代三套近似类型）

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
// 前后端共用 → 改一处全部跟随
```

## 5. 边界处运行时校验（PASS: 替代只静态不运行时）

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
