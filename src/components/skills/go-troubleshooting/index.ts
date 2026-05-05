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
  constraints: [
    "**先复现再修复**：无法复现的 bug 先增加可观测性（日志/pprof 端点），不盲改。",
    "**一次一个假设**：同时改多处 = 放弃定位能力；失败的假设要记录，避免重复。",
    "**修根因不修症状**：下游吞异常、放宽校验、加 retry 掩盖问题一律禁止。",
    "**证据先行**：日志/trace/profile/stack trace 排在假设前面；凭经验猜排序是反复出错的主因。",
    "**红牌警告**：\n- 没复现就提 PR → 停下\n- 一次改两个以上变量 → 停下\n- 用 `_ = err` 吞掉错误 → 停下",
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
