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
import { goPerformanceSkill } from "../go-performance/index";

export const goTroubleshootingSkill = defineSkill({
  id: "go-troubleshooting",
  fullName: "go-troubleshooting",
  description: "当 Go 程序出现异常行为需要排查：CPU 飙高、内存泄漏、goroutine 泄漏、死锁、竞态、panic 或性能回归时使用。",
  useCases: [
    "Go 程序出现 CPU 飙高、内存持续增长、goroutine 泄漏、死锁、数据竞争或性能回归。",
    "需要用 pprof/delve/race detector/GODEBUG 定位根因。",
    "生产环境异常排查：crash 日志分析、stack trace 解读、运行时 profile 采集。",
    "优化方法论和 benchmark 验证 → `go-performance`。",
    "goroutine/channel 死锁与泄漏模式 → `go-concurrency-patterns`。",
    "panic 恢复与运行时安全 → `go-safety`。",
  ],
  constraints: [
    "**先复现再修复**：无法复现的 bug 先增加可观测性（日志/pprof 端点），不盲改。",
    "**一次一个假设**：同时改多处 = 放弃定位能力；失败的假设要记录，避免重复。",
    "**修根因不修症状**：下游吞异常、放宽校验、加 retry 掩盖问题一律禁止。",
    "**证据先行**：日志/trace/profile/stack trace 排在假设前面；凭经验猜排序是反复出错的主因。",
    "**红牌警告**：\n- 没复现就提 PR → 停下\n- 一次改两个以上变量 → 停下\n- 用 `_ = err` 吞掉错误 → 停下",
  ],
  relatedSkills: [
    {
      get id() {
        return goConcurrencyPatternsSkill.id;
      },
      reason: "goroutine/channel 死锁与泄漏模式 → `go-concurrency-patterns`。",
    },
    {
      get id() {
        return goErrorHandlingSkill.id;
      },
      label: "go-safety",
      reason: "panic 恢复与运行时安全 → `go-safety`。",
    },
    {
      get id() {
        return goPerformanceSkill.id;
      },
      reason: "优化方法论和 benchmark 验证 → `go-performance`。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "未复现就改代码。",
      pass: "先构造最小复现，再提假设。",
    }),
    defineAntiPattern({
      fail: "同时改多处。",
      pass: "一次改一个变量，逐步验证。",
    }),
    defineAntiPattern({
      fail: "用 `log.Fatal` 吞上下文。",
      pass: "返回 error 让调用方决定。",
    }),
    defineAntiPattern({
      fail: "只看日志不看 profile。",
      pass: "CPU/内存问题必须用 pprof 定量。",
    }),
    defineAntiPattern({
      fail: "goroutine 只开不关。",
      pass: "检查退出路径，配合 context 取消。",
    }),
    defineAntiPattern({
      fail: "data race 靠肉眼查。",
      pass: "用 `go test -race ./...` 必须跑。",
    }),
    defineAntiPattern({
      fail: "线上加了 `fmt.Println` 调试。",
      pass: "用 delve 或 pprof HTTP 端点。",
    }),
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
      summary: "Go 诊断工具使用指南：pprof、delve、race detector、GODEBUG 与 trace。",
      loadWhen: "需要采集或解读 pprof、trace、race 报告等诊断信息时读取。",
    }),
    defineReference({
      id: "methodology",
      source: new URL("./references/methodology.md", import.meta.url),
      target: "references/methodology.md",
      title: "methodology.md",
      summary: "Go 问题排查方法论：复现、假设验证、证据收集与根因定位的流程。",
      loadWhen: "需要系统化排查 Go 程序异常行为或整理排查步骤时读取。",
    }),
  ],
});
