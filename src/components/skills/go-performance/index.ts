import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
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
    "并发瓶颈配合 `go-concurrency-patterns`；资源安全配合 `go-safety`。",
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
      label: "go-safety",
      reason: "并发瓶颈配合 `go-concurrency-patterns`；资源安全配合 `go-safety`。",
    },
    {
      get id() {
        return goConcurrencyPatternsSkill.id;
      },
      reason: "并发瓶颈配合 `go-concurrency-patterns`；资源安全配合 `go-safety`。",
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
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
