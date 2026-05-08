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
import { swiftConcurrencyExpertSkill } from "../swift-concurrency-expert/index";
import { swiftuiUiPatternsSkill } from "../swiftui-ui-patterns/index";

export const swiftuiPerformanceAuditSkill = defineSkill({
  id: "swiftui-performance-audit",
  fullName: "SwiftUI 性能审计",
  description: "当 SwiftUI 界面出现卡顿、掉帧、高 CPU 或重渲染问题时使用。",
  useCases: [
    "用户反馈列表滚动卡顿、动画掉帧、界面重绘过多、CPU / 内存异常。",
    "需要从代码审查切到 Instruments 指导，再回到具体修复方案。",
    "需要判断是身份不稳定、状态扇出、重计算还是布局链过深导致的性能问题。",
  ],
  constraints: [
    "先做代码级归因，再决定是否要求用户补 Instruments trace。",
    "优先修根因：状态粒度、身份稳定性、主线程重活、图片解码与布局复杂度。",
    "不要把 `equatable()`、缓存或 `.id()` 当万用药；先解释为什么会重绘。",
    "参考资料只使用真实存在的本地文档：`references/optimizing-swiftui-performance-instruments.md`、`references/understanding-improving-swiftui-performance.md`、`references/understanding-hangs-in-your-app.md`、`references/demystify-swiftui-performance-wwdc23.md`。",
  ],
  checklist: [
    "检查列表和动画区域是否存在 `UUID()`、`id: \\.self`、临时排序 / 过滤。",
    "检查 `body`、计算属性和 `task` 中是否混入格式化、图片解码、数据库或网络副作用。",
    "如果代码审查不足以定案，明确要求用户提供 SwiftUI template + Time Profiler trace。",
    "修复后要求按同一交互路径复测，比较前后 CPU、掉帧和内存峰值。",
  ],
  relatedSkills: [
    {
      get id() {
        return swiftConcurrencyExpertSkill.id;
      },
      reason: "性能问题来自 Task、actor、主线程隔离或并发边界时联动。",
    },
    {
      get id() {
        return swiftuiUiPatternsSkill.id;
      },
      reason: "需要整理视图结构、状态拥有者、导航或 sheet 模式以降低重绘扇出时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "body 里做重活",
      pass: "重计算移出 body",
    }),
    defineAntiPattern({
      fail: ".id(UUID()) 让树每次重建",
      pass: "稳定身份",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先审查列表、动画和高频刷新区域，定位身份稳定性、状态扇出、主线程重活和布局链复杂度。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "检查 `ForEach` 身份是否稳定，避免 `UUID()`、不稳定 `id: \\.self` 和临时排序/过滤导致树重建。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "把排序、格式化、图片解码、数据库、网络副作用和其他重计算移出 `body`。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "缩小状态扇出：让行视图只接收必要值，根视图持有状态，下游避免无关重绘。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "代码审查不足以定案时，要求 SwiftUI template 与 Time Profiler trace，并按同一交互路径复测。",
      }),
      defineWorkflowStep({
        id: "step-6",
        label: "修复后比较 CPU、掉帧、hang、内存峰值和用户可感知路径，不把 `.equatable()` 或缓存当万用药。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "性能假设、代码定位、身份稳定性、状态扇出、主线程重活和布局链审计结果。",
      "Instruments 需求或 trace 解读、修复建议、复测路径和前后指标。",
      "需要联动 Swift 并发或 SwiftUI UI 结构整理的边界。",
    ],
  }),
  references: [
    defineReference({
      id: "demystify-swiftui-performance-wwdc23",
      source: new URL("./references/demystify-swiftui-performance-wwdc23.md", import.meta.url),
      target: "references/demystify-swiftui-performance-wwdc23.md",
      title: "demystify-swiftui-performance-wwdc23.md",
      summary: "WWDC23 关于 SwiftUI 性能揭秘的会议内容摘要，包含身份稳定性和重绘机制。",
      loadWhen: "需要深入理解 SwiftUI 重绘机制和身份稳定性原理时读取。",
    }),
    defineReference({
      id: "optimizing-swiftui-performance-instruments",
      source: new URL("./references/optimizing-swiftui-performance-instruments.md", import.meta.url),
      target: "references/optimizing-swiftui-performance-instruments.md",
      title: "optimizing-swiftui-performance-instruments.md",
      summary: "使用 Instruments 工具优化 SwiftUI 性能的实践指南，包含模板选择和关键指标解读。",
      loadWhen: "需要指导用户使用 Instruments 采集性能数据或分析 trace 结果时读取。",
    }),
    defineReference({
      id: "understanding-hangs-in-your-app",
      source: new URL("./references/understanding-hangs-in-your-app.md", import.meta.url),
      target: "references/understanding-hangs-in-your-app.md",
      title: "understanding-hangs-in-your-app.md",
      summary: "SwiftUI 应用中卡顿问题的根因分析和排查方法。",
      loadWhen: "需要诊断 SwiftUI 应用的主线程卡顿或帧率下降时读取。",
    }),
    defineReference({
      id: "understanding-improving-swiftui-performance",
      source: new URL("./references/understanding-improving-swiftui-performance.md", import.meta.url),
      target: "references/understanding-improving-swiftui-performance.md",
      title: "understanding-improving-swiftui-performance.md",
      summary: "SwiftUI 性能优化综合指南，包含状态粒度、视图结构和布局链的最佳实践。",
      loadWhen: "需要系统性的 SwiftUI 性能优化参考或学习视图结构最佳实践时读取。",
    }),
  ],
});
