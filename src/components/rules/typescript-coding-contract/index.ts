import { defineRule, defineRuleBody, Platform } from "../../sdk";

export const typescriptCodingContractRule = defineRule({
  id: "typescript-coding-contract",
  title: "TypeScript Coding Contract",
  description: "读写 TypeScript 源码、类型声明、tsconfig 或 TS 测试配置时使用。",
  platforms: [Platform.Claude, Platform.Codex],
  body: defineRuleBody({
    lines: [
      "- 类型修复先拿到完整 `tsc --noEmit` 输出，再定位上游 schema、DTO、泛型或边界合同；不要用断言先压下游错误。",
      "- `any` 优先收口为 `unknown` 加类型守卫、schema parser、判别联合或必要泛型约束；逃生断言只留在最外层适配器。",
      "- 同一领域对象只保留一个 canonical contract；外部边界（路由、URL search、API payload、数据库行、消息体）必须同时有运行时解析和静态类型。",
      "- 高级类型只服务真实约束；泛型参数要有清晰语义和最小必要约束，公共类型工具要有最小使用样例。",
      "- DTO 变换集中在适配器层，业务层不要维护多套近似类型或靠可选链掩盖 schema 漂移。",
      "- 新增代码避免 `as any`、双重断言和 `// @ts-ignore`；确需例外必须说明外部边界原因和后续收敛方式。",
      "- 改 TypeScript 后优先跑 `tsc --noEmit`、项目 lint 和 Jest/Vitest 测试，并报告未验证项。",
    ],
  }),
  paths: [
    "**/*.ts",
    "**/*.tsx",
    "**/*.mts",
    "**/*.cts",
    "**/*.d.ts",
    "tsconfig.json",
    "tsconfig.*.json",
    "jest.config.ts",
    "vitest.config.ts",
    "eslint.config.ts",
  ],
  priority: 40,
});
