import {
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  InvocationPolicy,
  KnownTool,
  Platform,
  defineWorkflowStep,
} from "../../sdk";
import { procedureUse, typescriptTypeSafetyExtractTsErrors } from "../../procedures/index";

export const typescriptTypeSafetySkill = defineSkill({
  id: "typescript-type-safety",
  fullName: "TypeScript Type Safety",
  description: "当需要定位 TS 编译错误、清理 any、设计泛型/类型守卫/条件类型，或搭建路由/API/数据库边界的类型合同时使用。",
  useCases: [
    "**类型系统设计与修复：** `tsc --noEmit` 出现类型错误、旧代码充满 `any`/弱类型字典、需要设计泛型/类型守卫/条件类型/映射类型/模板字面量类型。",
    "**边界类型合同：** 新项目选型让路由/API/数据库共享合同、现有代码依赖字符串键/隐式约定/弱类型 DTO 需收口、要求\"拼错即编译失败\"、运行时校验与静态类型成对出现。",
  ],
  constraints: [
    "先跑 `tsc --noEmit` 再改代码，不盲改类型。",
    "`any` 优先用 `unknown` + 类型守卫、泛型约束或判别联合收口。",
    "先修上游合同，再修下游症状；不用断言压错误。",
    "高级类型只服务真实约束；普通对象够用时不要条件分发。",
    "所有泛型参数有清晰语义和最小必要约束；公共类型工具补验证示例。",
    "**单一 canonical contract**：同一领域对象只有一个合同，不写多套近似类型。",
    "所有外部边界先定义合同再写逻辑：路由、URL search、API payload、数据库行、消息体。",
    "运行时解析与静态类型成对出现，逃生舱口（`as any`/双重断言）只在最外层适配器。",
    "编译器报错优先于\"代码看起来像对的\"，不靠注释维持协议同步。",
  ],
  checklist: [
    "是否先拿到完整错误输出再决定改哪层？",
    "`any` 是否缩回边界层，不是简单换成新宽松断言？",
    "泛型参数是否有清晰职责和必要约束？条件类型在消除重复还是在藏黑盒？",
    "公共类型工具补了最小使用样例？",
    "每个外部边界是否有\"运行时解析 + 静态类型\"双重约束？",
    "DTO 变换是否集中在适配器层？类型是否由单一源头推导？",
    "AI 或新同事改字段名后，编译期能否暴露影响面？",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "用断言掩盖合同不一致",
      pass: "用类型守卫收口",
    }),
    defineAntiPattern({
      fail: "schema 漂移前端加可选链兜底：修前端可选链只能让错误更晚暴露。先修上游合同，必要时用 parser 把边界输入变成显式成功/失败。",
      pass: "先修上游 schema/契约，边界用 parser 显式区分成功和失败。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先获取完整 `tsc --noEmit` 输出；已有输出文件时用 `extract-ts-errors` 归组错误。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按文件、错误码和边界合同定位上游 schema / DTO / 泛型漂移，再处理下游症状。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "`any` 优先改为 `unknown` + 类型守卫、schema parser、判别联合或必要泛型约束。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "诊断顺序读取 `diagnosis-workflow`；高级类型读取 `advanced-patterns`；边界合同代码读取 `code-patterns`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "TypeScript 错误归组、上游合同根因和修复顺序。",
      "`any` / 断言 / 类型守卫 / 泛型 / schema parser 的收敛建议。",
      "需要补的类型示例、运行时校验和 `tsc --noEmit` / 测试验证命令。",
    ],
  }),
  tools: [KnownTool.Read, KnownTool.Grep, KnownTool.Glob, KnownTool.Bash],
  procedures: [
    procedureUse(typescriptTypeSafetyExtractTsErrors, {
      label: "归组 tsc 错误",
      when: "已有完整 `tsc --noEmit` 输出文件，需要按文件和错误码归组时。",
      reason: "自动按文件和错误码归组编译错误，避免在大量 tsc 输出中手动分类定位。",
    }),
  ],
  references: [
    defineReference({
      id: "diagnosis-workflow",
      source: new URL("./references/diagnosis-workflow.md", import.meta.url),
      target: "references/diagnosis-workflow.md",
      title: "TypeScript 诊断流程",
      summary: "tsc 输出归组、上游合同优先和逐类根因修复流程。",
      loadWhen: "需要定位 TypeScript 编译错误或组织修复顺序时读取。",
    }),
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
