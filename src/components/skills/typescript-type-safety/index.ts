import {
  defineReference,
  defineSkill,
  defineSkillScript,
  InvocationPolicy,
  KnownTool,
  Platform,
} from "../../sdk";

export const typescriptTypeSafety = defineSkill({
  id: "typescript-type-safety",
  fullName: "TypeScript Type Safety",
  description: "需要定位 TS 编译错误、清理 any、设计泛型/类型守卫/条件类型，或搭建路由/API/数据库边界的类型合同时使用。",
  useCases: [
    "**类型系统设计与修复：** `tsc --noEmit` 出现类型错误、旧代码充满 `any`/弱类型字典、需要设计泛型/类型守卫/条件类型/映射类型/模板字面量类型。",
    "**边界类型合同：** 新项目选型让路由/API/数据库共享合同、现有代码依赖字符串键/隐式约定/弱类型 DTO 需收口、要求\"拼错即编译失败\"、运行时校验与静态类型成对出现。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [KnownTool.Read, KnownTool.Grep, KnownTool.Glob, KnownTool.Bash],
  scripts: [
    defineSkillScript({
      id: "extract-ts-errors",
      entry: new URL("./scripts/extract-ts-errors.ts", import.meta.url),
      description: "把 tsc 输出按文件和错误码归组，便于先定位上游合同错误。",
      argsSchema: "ExtractTsErrorsArgs",
      outputSchema: "ExtractTsErrorsSummary",
    }),
  ],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "Advanced TypeScript Patterns",
      summary: "泛型、条件类型、映射类型、infer 与模板字面量类型的高级模式。",
      loadWhen: "需要判断高级类型是否服务真实约束，或需要设计公共类型工具时读取。",
    }),
    defineReference({
      id: "code-patterns",
      source: new URL("./references/code-patterns.md", import.meta.url),
      target: "references/code-patterns.md",
      title: "Boundary Contract Code Patterns",
      summary: "路由、API payload、DTO、数据库行与运行时 parser 的边界合同示例。",
      loadWhen: "需要设计或审查外部边界类型合同时读取。",
    }),
    defineReference({
      id: "rules",
      source: new URL("./references/rules/", import.meta.url),
      target: "references/rules",
      title: "TypeScript Rule Catalog",
      summary: "TypeScript 类型规则目录，按单个语言特性拆分。",
      loadWhen: "需要查询具体 TypeScript 类型特性的规则和反模式时读取对应文件。",
    }),
  ],
});

export const typescriptTypeSafetySkill = typescriptTypeSafety;
