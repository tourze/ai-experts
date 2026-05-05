---
name: typescript-type-safety
description: 需要定位 TS 编译错误、清理 `any`、设计泛型/类型守卫/条件类型，或搭建路由/API/数据库边界的类型合同时使用。
---

# TypeScript Type Safety

## 适用场景

**类型系统设计与修复：** `tsc --noEmit` 出现类型错误、旧代码充满 `any`/弱类型字典、需要设计泛型/类型守卫/条件类型/映射类型/模板字面量类型。

**边界类型合同：** 新项目选型让路由/API/数据库共享合同、现有代码依赖字符串键/隐式约定/弱类型 DTO 需收口、要求"拼错即编译失败"、运行时校验与静态类型成对出现。

## 核心约束

- 先跑 `tsc --noEmit` 再改代码，不盲改类型。
- `any` 优先用 `unknown` + 类型守卫、泛型约束或判别联合收口。
- 先修上游合同，再修下游症状；不用断言压错误。
- 高级类型只服务真实约束；普通对象够用时不要条件分发。
- 所有泛型参数有清晰语义和最小必要约束；公共类型工具补验证示例。
- **单一 canonical contract**：同一领域对象只有一个合同，不写多套近似类型。
- 所有外部边界先定义合同再写逻辑：路由、URL search、API payload、数据库行、消息体。
- 运行时解析与静态类型成对出现，逃生舱口（`as any`/双重断言）只在最外层适配器。
- 编译器报错优先于"代码看起来像对的"，不靠注释维持协议同步。

## 代码模式

用泛型替换 `any`、`unknown` + 类型守卫收口外部输入、判别联合穷尽校验等模式参考 [typescript-magician 高级模式](../typescript-magician/references/advanced-patterns.md) 和 [typescript-magician 规则目录](../typescript-magician/rules/)。

路由参数类型化、不可信输入解析、DTO 显式变换、单一 schema 推导、边界运行时校验见 [offensive-typesafety 代码模式参考](../offensive-typesafety/references/code-patterns.md)。

## 检查清单

- 是否先拿到完整错误输出再决定改哪层？
- `any` 是否缩回边界层，不是简单换成新宽松断言？
- 泛型参数是否有清晰职责和必要约束？条件类型在消除重复还是在藏黑盒？
- 公共类型工具补了最小使用样例？
- 每个外部边界是否有"运行时解析 + 静态类型"双重约束？
- DTO 变换是否集中在适配器层？类型是否由单一源头推导？
- AI 或新同事改字段名后，编译期能否暴露影响面？

## 反模式

### FAIL: 用断言掩盖合同不一致

```ts
const user = fetchUser() as User; // as 只骗编译器
```

### PASS: 用类型守卫收口

```ts
const raw = fetchUser();
if (!isUser(raw)) throw new Error("invalid user shape");
// 编译器+运行时双重保证
```

### FAIL: 类型体操替代普通对象 → PASS: 直白对象映射

更多泛型设计反例（过多泛型、推导优先）见 [typescript-magician 高级模式](../typescript-magician/references/advanced-patterns.md)。

### FAIL: schema 漂移前端加可选链兜底 → PASS: 修上游合同

### FAIL: 三套近似类型 → PASS: 单一 schema 推导

见 [offensive-typesafety 代码模式参考](../offensive-typesafety/references/code-patterns.md) 第 4 节。

### FAIL: 只静态不运行时

```ts
type UserDto = { id: string; email: string };
const data: UserDto = rawData as UserDto; // 服务端改字段，类型系统不知道
```

### PASS: 边界处用 parser 函数做运行时校验

见 [offensive-typesafety 代码模式参考](../offensive-typesafety/references/code-patterns.md) 第 5 节。
