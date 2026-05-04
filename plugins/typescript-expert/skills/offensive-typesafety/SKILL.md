---
name: offensive-typesafety
description: 在搭建新的 TypeScript 技术栈、设计路由/API/数据库边界，或把字符串协议升级为编译器可验证合同的时候使用。
---

# Offensive Typesafety

## 适用场景

- 需要为新项目选型，决定路由、表单、服务端接口、数据库模型如何共享同一份合同。
- 现有代码大量依赖字符串键、隐式约定、`as any` 或弱类型 DTO，需要收口成可重构的边界。
- 多人协作或 AI 生成代码时，要求"拼错即编译失败"，而不是"上线后才发现字段不对"。
- 需要补强复杂泛型、类型提取或工具类型细节时，联动 [typescript-magician](../typescript-magician/SKILL.md)。
- 需要条件类型、映射类型与模板字面量能力时，联动 [typescript-magician](../typescript-magician/SKILL.md)。

## 核心约束

- 所有外部边界先定义合同，再写业务逻辑：路由参数、URL search、API payload、数据库行、消息体都算边界。
- 编译器报错优先于"代码看起来像对的"；不要靠注释、口头约定或 README 维持协议同步。
- 运行时校验与静态类型必须成对出现：静态类型负责开发期约束，运行时解析负责不可信输入落地。
- 所有逃生舱口都要局部化：`as any`、双重断言、宽松索引访问只能出现在最外层适配器，不能扩散进业务核心。
- 同一个领域对象只能有一个 canonical contract；前端 DTO、后端返回、数据库模型不能各写一份互相漂移的"近似类型"。

## 代码模式

具体实现模式和代码示例见 `references/code-patterns.md`，涵盖：
1. 路由参数类型化（替代字符串拼接）
2. 不可信输入解析（先 parse 再进业务层）
3. DTO 显式变换（禁止隐式 as 断言）
4. 单一 schema 推导（替代多套近似类型）
5. 边界运行时校验（替代只静态不运行时）

## 检查清单

- 每个外部边界是否都有"运行时解析 + 静态类型"双重约束？
- 路由、查询参数、API payload 是否仍在用裸字符串和手写对象拼装？
- DTO 变换是否集中在适配器层，而不是在 UI / Service / Repository 到处散落？
- 类型定义是否由单一源头推导，而不是前后端、测试、文档各写一份？
- AI 或新同事改字段名后，是否能在编译期立刻暴露影响面？

## 反模式

### FAIL: 三套近似类型

前端 `type User = { id: string; isActive: boolean }`、后端 `interface UserDto { id: string; status: 'active' | 'inactive' }`、数据库 `CREATE TABLE users (id uuid, is_active boolean)` — 三处不一致，bug 永远在边界出现。

→ **PASS**: 用单一 schema 推导，前后端共用同一份合同。

### FAIL: 只静态不运行时

```ts
type UserDto = { id: string; email: string };
const rawData: unknown = { id: "u1", email: "a@example.com" };
const data: UserDto = rawData as UserDto;
void data;
// 服务端改字段，前端类型系统不知道，运行时静默错位
```

→ **PASS**: 边界处用 parser 函数做运行时校验，不符合立即抛错。
