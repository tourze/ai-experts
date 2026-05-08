import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
} from "../../sdk";
import { goConcurrencyPatternsSkill } from "../go-concurrency-patterns/index";
import { goErrorHandlingSkill } from "../go-error-handling/index";

export const goPerformanceSkill = defineSkill({
  id: "go-performance",
  fullName: "go-performance",
  description: "当 Go 代码需要性能优化、benchmark、pprof、benchstat 或优化验证时使用。",
  useCases: [
    "优化热路径延迟、吞吐、内存分配、GC 压力或连接池。",
    "写 Go benchmark、用 `benchstat` 比较实现、解释 pprof 输出。",
    "审查\"性能优化\"是否有基线、统计显著性和回归测试。",
    "并发瓶颈配合 `go-concurrency-patterns`；panic / 错误边界配合 `go-error-handling`。",
    "持续监控 → go-observability；排查\"为什么慢\" → go-troubleshooting。",
  ],
  constraints: [
    "没有基线不优化；先定义目标指标，再写 benchmark 或采集 profile。",
    "一次只改一个变量，改前改后用同一命令多次采样，再用 `benchstat` 比较。",
    "优先优化已证实的瓶颈：CPU profile、heap profile、trace、mutex/block profile 或生产指标。",
    "先排除外部瓶颈：数据库、网络、锁等待、上游 API 慢时，减少本地分配通常无效。",
    "优化代码必须保留可读性解释和 benchmark 证据，避免后续被误删。",
    "`sync.Pool`、`unsafe`、手写缓存只在 profile 证明收益并有测试保护时使用。",
  ],
  relatedSkills: [
    {
      get id() {
        return goErrorHandlingSkill.id;
      },
      reason: "panic、错误传播或资源释放边界影响性能修复安全性时联动。",
    },
    {
      get id() {
        return goConcurrencyPatternsSkill.id;
      },
      reason: "goroutine、channel、锁竞争或并发度瓶颈时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "无基线就优化。",
      pass: "先写 benchmark 采集基线，再改。",
    }),
    defineAntiPattern({
      fail: "单次采样下结论。",
      pass: "用 `benchstat` 至少 8 次采样。",
    }),
    defineAntiPattern({
      fail: "优化外部瓶颈。",
      pass: "先排除 DB/网络延迟，再改 Go 代码。",
    }),
    defineAntiPattern({
      fail: "逃逸分析盲区。",
      pass: "用 `go build -gcflags=\"-m\"` 检查。",
    }),
    defineAntiPattern({
      fail: "结构体字段乱序导致 padding 浪费。",
      pass: "用 `fieldalignment` 工具，按大小降序排列。",
    }),
    defineAntiPattern({
      fail: "`sync.Pool` 用于长期对象。",
      pass: "Pool 只适合短生命周期临时对象。",
    }),
    defineAntiPattern({
      fail: "优化删了正确性测试。",
      pass: "优化必须保留正确性测试。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认是否外部瓶颈，再用 CPU / heap / goroutine / mutex / block profile 和 trace 定位 Go 侧问题。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按算法复杂度、分配、系统调用、GC、锁竞争和并发度顺序收敛，不凭直觉优化。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "逃逸分析、alloc profile 和 trace 结果必须绑定命令和输入场景。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "排查决策树读取 `performance-triage`；pprof / benchmark 细节读取对应 references。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "性能基线、profile / trace 命令、输入场景和瓶颈分类。",
      "CPU、内存、GC、锁、goroutine 或外部依赖的优先修复建议。",
      "验证指标、回归风险和仍需采集的数据。",
    ],
  }),
  references: [
    defineReference({
      id: "performance-triage",
      source: new URL("./references/performance-triage.md", import.meta.url),
      target: "references/performance-triage.md",
      title: "Go 性能排查决策树",
      summary: "外部瓶颈、CPU、内存、GC、锁竞争和并发度的排查路径与诊断命令。",
      loadWhen: "需要快速判断 Go 性能问题应该先看哪类证据时读取。",
    }),
    defineReference({
      id: "benchmarking",
      source: new URL("./references/benchmarking.md", import.meta.url),
      target: "references/benchmarking.md",
      title: "benchmarking.md",
      summary: "Go benchmark 编写规范：命名、setup/cleanup、表驱动、编译器优化防护与 benchstat。",
      loadWhen: "需要编写或审查 Go benchmark 并用 benchstat 比较结果时读取。",
    }),
    defineReference({
      id: "pprof",
      source: new URL("./references/pprof.md", import.meta.url),
      target: "references/pprof.md",
      title: "pprof.md",
      summary: "pprof 性能剖析：CPU heap goroutine mutex block profile 的采集与解读。",
      loadWhen: "需要采集或分析 pprof profile 以定位性能瓶颈时读取。",
    }),
  ],
});
