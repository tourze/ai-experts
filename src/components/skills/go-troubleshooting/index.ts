import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";

export const goTroubleshootingSkill = defineSkill({
  id: "go-troubleshooting",
  fullName: "go-troubleshooting",
  description: "当 Go 程序出现异常行为需要排查：CPU 飙高、内存泄漏、goroutine 泄漏、死锁、竞态、panic 或性能回归时使用。",
  useCases: [
    "Go 程序出现 CPU 飙高、内存持续增长、goroutine 泄漏、死锁、数据竞争或性能回归。",
    "需要用 pprof/delve/race detector/GODEBUG 定位根因。",
    "生产环境异常排查：crash 日志分析、stack trace 解读、运行时 profile 采集。",
    "优化方法论和 benchmark 验证 → [go-performance](../go-performance/SKILL.md)。",
    "goroutine/channel 死锁与泄漏模式 → [go-concurrency-patterns](../go-concurrency-patterns/SKILL.md)。",
    "panic 恢复与运行时安全 → [go-safety](../go-error-handling/SKILL.md)。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "diagnostic-tools",
      source: new URL("./references/diagnostic-tools.md", import.meta.url),
      target: "references/diagnostic-tools.md",
      title: "diagnostic-tools.md",
      summary: "Reference material for go-troubleshooting.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
    defineReference({
      id: "methodology",
      source: new URL("./references/methodology.md", import.meta.url),
      target: "references/methodology.md",
      title: "methodology.md",
      summary: "Reference material for go-troubleshooting.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
