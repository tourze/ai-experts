import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";
import { swiftuiPerformanceAuditSkill } from "../swiftui-performance-audit/index";
import { swiftuiUiPatternsSkill } from "../swiftui-ui-patterns/index";

export const swiftConcurrencyExpertSkill = defineSkill({
  id: "swift-concurrency-expert",
  fullName: "Swift 并发",
  description: "当用户需要审查或修复 Swift 6.2+ concurrency、actor isolation、Sendable、Task、MainActor 或数据竞争迁移时使用。",
  useCases: [
    "修复 Swift 6.2+ 并发编译错误或数据竞争问题。",
    "判断代码应放在 `@MainActor`、`actor`、`nonisolated` 还是普通类型上。",
    "审查 `Sendable`、任务生命周期、结构化并发和 SwiftUI 并发用法。",
  ],
  constraints: [
    "先收集真实诊断信息，再决定修法；不要先加 `@unchecked Sendable` 或 `nonisolated(unsafe)` 糊过去。",
    "UI 类型先考虑 `@MainActor`，共享可变状态先考虑 `actor`。",
    "只有在能证明线程安全时才接受 `Sendable` / `@unchecked Sendable`。",
    "需要背景资料时读取 `references/swift-6-2-concurrency.md`、`references/approachable-concurrency.md`。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "全局 @MainActor 压报错",
      pass: "按职责分隔离域",
    }),
    defineAntiPattern({
      fail: "@unchecked Sendable 糊过",
      pass: "actor 保证隔离",
    }),
  ],
  relatedSkills: [
    {
      get id() {
        return swiftuiPerformanceAuditSkill.id;
      },
      reason: "需要判断 SwiftUI 卡顿、重渲染或主线程重活是否由并发边界导致时联动。",
    },
    {
      get id() {
        return swiftuiUiPatternsSkill.id;
      },
      reason: "需要把并发状态拆回 SwiftUI 视图结构、状态拥有者或依赖注入模式时联动。",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "审查或迁移 Swift 6.2+ 并发边界，收敛 actor isolation、Sendable、Task 生命周期、MainActor 和数据竞争诊断。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先收集完整编译诊断、运行时卡顿 / 数据竞争证据和相关类型边界，不凭单条报错泛化修法。",
      "按职责划分隔离域：UI / SwiftUI 状态优先 MainActor，共享可变状态优先 actor，纯值数据检查 Sendable。",
      "处理 Task 生命周期、取消传播和结构化并发，避免把长期任务藏在不受控的 detached task 里。",
      "只有能证明底层线程安全时才接受 `@unchecked Sendable`、`nonisolated` 或 unsafe 兜底。",
      "需要代码模式读取 `code-patterns`，需要语言机制或迁移背景读取 Swift 6.2+ references。",
      "修复后运行编译、并发检查和相关 UI / 性能复测，记录仍需架构调整的边界。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "并发诊断摘要、涉及类型 / actor / MainActor / Sendable 的隔离图。",
      "最小修复方案或迁移步骤，以及拒绝 unsafe 兜底的原因。",
      "Task 生命周期、取消、主线程更新和共享状态保护的检查结果。",
      "编译 / 测试 / 性能复测结论和剩余风险。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "code-patterns",
      source: new URL("./references/code-patterns.md", import.meta.url),
      target: "references/code-patterns.md",
      title: "Swift 并发快速代码模式",
      summary: "MainActor UI 状态更新和 actor 保护共享可变状态的最小代码示例。",
      loadWhen: "需要快速查看 Swift 并发隔离域或 actor 状态保护写法时读取。",
    }),
    defineReference({
      id: "approachable-concurrency",
      source: new URL("./references/approachable-concurrency.md", import.meta.url),
      target: "references/approachable-concurrency.md",
      title: "approachable-concurrency.md",
      summary: "Swift 并发的入门级指南，以易懂的方式解释 actor、Sendable 和 Task 核心概念。",
      loadWhen: "需要从基础理解 Swift 并发模型或向团队解释并发概念时读取。",
    }),
    defineReference({
      id: "swift-6-2-concurrency",
      source: new URL("./references/swift-6-2-concurrency.md", import.meta.url),
      target: "references/swift-6-2-concurrency.md",
      title: "swift-6-2-concurrency.md",
      summary: "Swift 6.2+ 并发特性的完整参考，包含 actor isolation、Sendable 检查和数据竞争检测。",
      loadWhen: "需要解决 Swift 6.2+ 并发编译错误或进行数据竞争迁移时读取。",
    }),
    defineReference({
      id: "swift-6-2-hang-elimination",
      source: new URL("./references/swift-6-2-hang-elimination.md", import.meta.url),
      target: "references/swift-6-2-hang-elimination.md",
      title: "swift-6-2-hang-elimination.md",
      summary: "Swift 6.2+ 应用中消除主线程卡顿的指南和最佳实践。",
      loadWhen: "需要诊断和解决 Swift 并发导致的应用卡顿问题时读取。",
    }),
    defineReference({
      id: "swiftui-concurrency-tour-wwdc",
      source: new URL("./references/swiftui-concurrency-tour-wwdc.md", import.meta.url),
      target: "references/swiftui-concurrency-tour-wwdc.md",
      title: "swiftui-concurrency-tour-wwdc.md",
      summary: "WWDC 关于 SwiftUI 与并发结合的精彩内容摘要，涵盖 SwiftUI 视图中的 Task 和 MainActor 使用。",
      loadWhen: "需要了解 SwiftUI 与 Swift 并发的最佳实践或 WWDC 官方指南时读取。",
    }),
  ],
});
