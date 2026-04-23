# 高级类型代码模式

本文件是 typescript-advanced-types SKILL.md 的拆分内容，包含映射类型、模板字面量类型与递归字段路径的完整代码。

## 用映射类型和模板字面量批量生成稳定 API

```ts
type Events = {
  created: { id: string };
  archived: { id: string; reason: string };
};

type EventHandlers<T extends Record<string, object>> = {
  [K in keyof T as `on${Capitalize<string & K>}`]: (payload: T[K]) => string;
};

const handlers: EventHandlers<Events> = {
  onCreated: ({ id }) => id,
  onArchived: ({ reason }) => reason,
};

if (handlers.onArchived({ id: "evt-1", reason: "done" }) !== "done") {
  throw new Error("mapped type drift");
}
```

## 用递归模板字面量表达字段路径

```ts
type DotPath<T> = T extends object
  ? {
      [K in keyof T & string]:
        T[K] extends object
          ? K | `${K}.${DotPath<T[K]>}`
          : K;
    }[keyof T & string]
  : never;

type Config = {
  server: {
    host: string;
    port: number;
  };
  features: {
    billing: {
      enabled: boolean;
    };
  };
};

const selectedPath: DotPath<Config> = "features.billing.enabled";
if (selectedPath !== "features.billing.enabled") {
  throw new Error("template literal type drift");
}
```
