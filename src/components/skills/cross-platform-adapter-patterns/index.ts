import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "adapter-interface",
      source: new URL("./references/adapter-interface.md", import.meta.url),
      target: "references/adapter-interface.md",
      title: "adapter-interface.md",
      summary: "Reference material for cross-platform-adapter-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "di-container",
      source: new URL("./references/di-container.md", import.meta.url),
      target: "references/di-container.md",
      title: "di-container.md",
      summary: "Reference material for cross-platform-adapter-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "monorepo-layout",
      source: new URL("./references/monorepo-layout.md", import.meta.url),
      target: "references/monorepo-layout.md",
      title: "monorepo-layout.md",
      summary: "Reference material for cross-platform-adapter-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "rust-cfg-abstraction",
      source: new URL("./references/rust-cfg-abstraction.md", import.meta.url),
      target: "references/rust-cfg-abstraction.md",
      title: "rust-cfg-abstraction.md",
      summary: "Reference material for cross-platform-adapter-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
