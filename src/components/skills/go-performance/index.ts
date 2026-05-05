import {
  InvocationPolicy,
  KnownTool,
  Platform,
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
      summary: "Reference material for go-performance.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "pprof",
      source: new URL("./references/pprof.md", import.meta.url),
      target: "references/pprof.md",
      title: "pprof.md",
      summary: "Reference material for go-performance.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
