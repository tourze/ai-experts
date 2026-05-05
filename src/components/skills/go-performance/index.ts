import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const goPerformanceSkill = defineSkill({
  id: "go-performance",
  fullName: "go-performance",
  description: "当 Go 代码需要性能优化、benchmark、pprof、benchstat 或优化验证时使用。",
  useCases: [
    "优化热路径延迟、吞吐、内存分配、GC 压力或连接池。",
    "写 Go benchmark、用 `benchstat` 比较实现、解释 pprof 输出。",
    "审查\"性能优化\"是否有基线、统计显著性和回归测试。",
    "并发瓶颈配合 [go-concurrency-patterns](../go-concurrency-patterns/SKILL.md)；资源安全配合 [go-safety](../go-error-handling/SKILL.md)。",
    "持续监控 → go-observability；排查\"为什么慢\" → go-troubleshooting。",
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
