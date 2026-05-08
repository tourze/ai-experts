import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";

export const androidArchitectureSkill = defineSkill({
  id: "android-architecture",
  fullName: "Android 现代架构",
  description: "当用户要设计或重构 Android 架构、Clean Architecture、Hilt 注入或多模块时使用。",
  useCases: [
    "设计或重构 Android 应用架构",
    "搭建新项目的模块结构",
    "配置 Hilt 依赖注入",
    "评审代码的分层合理性",
  ],
  constraints: [
    "依赖方向必须单向向内：UI -> Domain -> Data，禁止反向依赖和循环依赖。",
    "Domain 层必须是纯 Kotlin，不能导入 `android.*`，并只依赖 Repository 接口或 domain model。",
    "ViewModel 通过只读 `StateFlow` 暴露 UI 状态，不能把 `MutableStateFlow` / `MutableSharedFlow` 暴露给 UI。",
    "Repository 的 `suspend` 函数必须 main-safe，线程切换和数据源兜底在实现内部处理。",
    "Hilt 接口绑定优先用 `@Binds`，第三方实例或 builder 才用 `@Provides`。",
    "Feature 模块之间禁止互相依赖；共享模型、domain、ui 和 data 能力放入合适的 `:core:*` 模块。",
  ],
  checklist: [
    "Domain 层无 `android.*` 导入",
    "Repository 的 `suspend` 函数 main-safe（内部 `withContext` 切线程）",
    "ViewModel 通过 `StateFlow` 向 UI 暴露状态",
    "`MutableStateFlow` / `MutableSharedFlow` 不对外暴露（通过 `.asStateFlow()` 转为只读）",
    "Hilt Module 中接口绑定用 `@Binds`，仅第三方实例用 `@Provides`",
    "Feature 模块不互相依赖，只依赖 `:core:*`",
    "依赖方向单向向内，无循环依赖",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "Domain 层依赖 Android",
      pass: "Domain 层纯 Kotlin",
    }),
    defineAntiPattern({
      fail: "ViewModel 暴露可变状态",
      pass: "只读 StateFlow",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先画出现有模块、包、入口页面、ViewModel、UseCase、Repository 和 DataSource 的依赖关系。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按 UI、Domain、Data 三层归类职责；Domain 可选但推荐，用于收敛业务规则和纯 Kotlin model。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "检查状态边界：ViewModel 只暴露只读状态，UI 不直接依赖 Data 层实现。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "检查数据边界：Repository 接口放在内层，Data 层实现远端、本地和缓存兜底，`suspend` 函数保持 main-safe。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "检查 Hilt 模块：接口绑定、第三方实例、scope 和 feature 自有 Module 是否归属清晰；代码模式读取 `architecture-patterns`。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "给出模块拆分、依赖倒置、迁移顺序和验证点，避免一次性大重构破坏交付。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "当前架构依赖图、层级归类和违反单向依赖的具体位置。",
      "目标模块结构、接口归属、Hilt Module 归属和迁移顺序。",
      "StateFlow、Repository、UseCase、DataSource 的边界修复建议。",
      "需要补充的单元测试 / 集成测试和架构守护规则。",
    ],
  }),
  references: [
    defineReference({
      id: "architecture-patterns",
      source: new URL("./references/architecture-patterns.md", import.meta.url),
      target: "references/architecture-patterns.md",
      title: "Android 架构代码模式",
      summary: "Clean Architecture 分层、Repository main-safe 实现、Hilt Module 和多模块规则示例。",
      loadWhen: "需要查看 Android 架构分层、Hilt 绑定或多模块拆分代码模式时读取。",
    }),
  ],
});
