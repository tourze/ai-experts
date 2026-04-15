---
name: typescript-magician
description: 当需要定位 TypeScript 编译错误、清理 `any`、设计复杂泛型、补齐类型守卫或收敛工具类型时使用。
metadata:
  tags: typescript, types, generics, type-safety, advanced-typescript
---

# TypeScript 类型魔法师

## 适用场景

- `tsc --noEmit`、编辑器诊断或构建日志里出现类型错误，需要定位真正的类型断点。
- 旧代码里充满 `any`、弱类型字典、隐式索引访问，想逐步替换成严格边界。
- 需要设计可推导的泛型函数、类型守卫、品牌类型、条件类型或工具类型。
- 需要把“值的真实形状”从 `unknown`、第三方 API 响应或动态配置里安全提取出来。
- 遇到系统级类型设计时，分别联动 [typescript-advanced-types](../typescript-advanced-types/SKILL.md) 和 [offensive-typesafety](../offensive-typesafety/SKILL.md)。

## 核心约束

- 先跑一遍 `tsc --noEmit` 或项目现有 typecheck，再改代码；没有报错上下文就不要盲改类型。
- `any` 不能直接换成更长的 `any` 变体；优先用 `unknown` + 类型守卫、泛型约束或判别联合收口。
- 先修上游合同，再修下游症状。不要用宽松断言把真正的错误压过去。
- 每次收紧类型后都要确认调用点仍成立，尤其是库函数、公共 DTO 与 Hook 返回值。
- 对复杂推导保留最小解释性命名；如果读者无法从类型名看出意图，就说明设计过载了。

## 代码模式

### 1. 用泛型替换“输入输出都糊成 `any`”的工具函数

```ts
function getProperty<T extends object, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}

const project = { name: "ai-experts", stars: 12 };
const stars = getProperty(project, "stars");

if (stars !== 12) {
  throw new Error("generic accessor drift");
}
```

### 2. 先用 `unknown` 接住外部输入，再用类型守卫放行

```ts
type User = { id: number; name: string };

function isUser(value: unknown): value is User {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "name" in value
  );
}

function normalizeUser(value: unknown): User {
  if (!isUser(value)) {
    throw new Error("Invalid user shape");
  }

  return value;
}

const user = normalizeUser({ id: 1, name: "Ada" });
if (user.name !== "Ada") {
  throw new Error("type guard drift");
}
```

### 3. 用判别联合和穷尽校验定位遗漏分支

```ts
type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: string[] }
  | { status: "error"; message: string };

function summarize(state: LoadState): string {
  switch (state.status) {
    case "idle":
      return "idle";
    case "loading":
      return "loading";
    case "success":
      return `${state.data.length} items`;
    case "error":
      return state.message;
    default: {
      const exhaustive: never = state;
      return exhaustive;
    }
  }
}

if (summarize({ status: "success", data: ["a", "b"] }) !== "2 items") {
  throw new Error("discriminated union drift");
}
```

### 4. 规则索引

- 核心模式：
  [as-const-typeof](rules/as-const-typeof.md)、
  [array-index-access](rules/array-index-access.md)、
  [utility-types](rules/utility-types.md)
- 泛型与推导：
  [generics-basics](rules/generics-basics.md)、
  [builder-pattern](rules/builder-pattern.md)、
  [deep-inference](rules/deep-inference.md)
- 类型级编程：
  [conditional-types](rules/conditional-types.md)、
  [infer-keyword](rules/infer-keyword.md)、
  [template-literal-types](rules/template-literal-types.md)、
  [mapped-types](rules/mapped-types.md)
- 类型安全与排错：
  [opaque-types](rules/opaque-types.md)、
  [type-narrowing](rules/type-narrowing.md)、
  [function-overloads](rules/function-overloads.md)、
  [error-diagnosis](rules/error-diagnosis.md)

## 检查清单

- 是否先拿到完整错误输出，再决定改哪一层类型？
- 是否把 `any` 缩回了边界层，而不是简单替换成新的宽松断言？
- 是否用泛型约束、类型守卫或判别联合表达了真实业务规则？
- 是否补了穷尽分支、负例或最小调用样例，避免类型回归？
- 是否让命名反映类型意图，而不是把复杂性藏进匿名条件类型？

## 反模式

- 看到报错就先 `as Foo`，用断言掩盖真正的合同不一致。
- 把 `unknown` 直接改成 `any`，失去所有收口能力。
- 一个函数同时堆叠过多重载、条件类型和模板字面量，结果调用方比实现方更难读。
- 不跑 typecheck，只靠编辑器局部提示猜测是否修好了。
- 类型问题明明来自 schema/DTO 漂移，却在 UI 端不断追加可选链和空值兜底。
