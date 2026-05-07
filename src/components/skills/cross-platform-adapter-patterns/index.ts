import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const crossPlatformAdapterPatternsSkill = defineSkill({
  id: "cross-platform-adapter-patterns",
  fullName: "cross-platform-adapter-patterns",
  description: "在设计跨平台应用的平台抽象层、适配器接口、运行时分支和 monorepo 组织时使用。",
  useCases: [
    "需要让同一套业务逻辑运行在多个平台上，或设计共享包与平台包的边界。",
    "交叉引用：边界分析配合 `seam-ripper`；架构蓝图配合 `architecture-blueprint-generator`。",
  ],
  constraints: [
    "领域逻辑必须平台无关；平台代码只存在于 adapter 层。",
    "接口定义在共享包；每个平台独立实现，平台包之间禁止互引。",
    "平台检测只出现在边界（入口、DI 容器），不渗透到业务逻辑。",
    "文件扩展名分叉是构建时机制；`Platform.select` 仅用于值选择。",
    "适配器不得将平台原语泄漏到共享层。",
    "平台不支持某能力时必须返回类型化错误或明确降级值。",
  ],
  checklist: [
    "`shared-core` 是否零平台导入。",
    "适配器注册是否集中在 app 入口。",
    "依赖方向是否单向：`apps -> platform-* -> shared-core`。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "共享包 import 平台",
      pass: "接口在共享 / 实现在平台",
    }),
    defineAntiPattern({
      fail: "平台包互相依赖",
      pass: "共享层兜底",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先列出需要跨平台支持的能力、目标平台、差异点和最低可接受降级行为。",
      "定义共享层接口和错误/降级合同，接口设计细节按需读取 `adapter-interface` reference。",
      "为每个平台设计独立实现和注册位置，避免平台包互相依赖；DI 方案按需读取 `di-container` reference。",
      "检查 monorepo 包边界和依赖方向，目录布局按需读取 `monorepo-layout` reference。",
      "如果涉及 Rust 条件编译或平台特性门控，读取 `rust-cfg-abstraction` reference。",
      "输出边界图、接口草案、平台实现清单和验证方案。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "平台能力矩阵与降级策略。",
      "共享接口、平台实现和注册点。",
      "包依赖方向与禁止依赖清单。",
      "需要读取的 reference 和验证计划。",
    ],
  }),
  references: [
    defineReference({
      id: "adapter-interface",
      source: new URL("./references/adapter-interface.md", import.meta.url),
      target: "references/adapter-interface.md",
      title: "adapter-interface.md",
      summary: "跨平台适配器接口设计模式：共享层接口定义与平台独立实现。",
      loadWhen: "需要设计平台抽象接口或定义共享包与平台包边界时读取。",
    }),
    defineReference({
      id: "di-container",
      source: new URL("./references/di-container.md", import.meta.url),
      target: "references/di-container.md",
      title: "di-container.md",
      summary: "跨平台依赖注入容器设计：平台适配器注册与共享层解耦策略。",
      loadWhen: "需要设计跨平台 DI 架构或集中管理适配器注册时读取。",
    }),
    defineReference({
      id: "monorepo-layout",
      source: new URL("./references/monorepo-layout.md", import.meta.url),
      target: "references/monorepo-layout.md",
      title: "monorepo-layout.md",
      summary: "跨平台 Monorepo 目录布局：共享核心、平台特定与 app 层组织规范。",
      loadWhen: "需要组织跨平台 monorepo 结构或设计包依赖关系时读取。",
    }),
    defineReference({
      id: "rust-cfg-abstraction",
      source: new URL("./references/rust-cfg-abstraction.md", import.meta.url),
      target: "references/rust-cfg-abstraction.md",
      title: "rust-cfg-abstraction.md",
      summary: "Rust cfg 平台抽象模式：条件编译、平台检测与适配器组织。",
      loadWhen: "需要在 Rust 中实现跨平台编译时的适配层时读取。",
    }),
  ],
});
