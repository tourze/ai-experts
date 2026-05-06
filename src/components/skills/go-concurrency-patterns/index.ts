import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
} from "../../sdk";

export const goConcurrencyPatternsSkill = defineSkill({
  id: "go-concurrency-patterns",
  fullName: "Go 并发模式",
  description: "当 Go 代码涉及并发、goroutine 生命周期控制或竞态排查时使用。",
  useCases: [
    "构建有上限的 worker pool、fan-out/fan-in pipeline、批量请求并发执行。",
    "需要把取消信号、超时和错误传播到整条 goroutine 链路。",
    "需要实现服务优雅停机，避免 goroutine 泄漏、悬挂 channel、僵尸任务。",
  ],
  constraints: [
    "每个 goroutine 都必须有明确退出路径：`ctx.Done()`、输入 channel 关闭、或父协程回收。",
    "channel 的关闭权属于发送方；接收方只能消费，不能代替上游收尾。",
    "并发数必须可控：默认使用 `errgroup.SetLimit` 或信号量。",
    "错误传播必须和取消联动：某个子任务失败后，其他子任务尽快退出。",
    "避免把 `sync.Map` 当作默认容器。写多读少时优先分片 map + `RWMutex`。",
    "不要用 `time.Sleep` 做同步。等待完成用 `WaitGroup`、channel、`errgroup`。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "无限制地启动 goroutine。",
      pass: "用 errgroup.SetLimit(n) 或信号量控制并发数。",
    }),
    defineAntiPattern({
      fail: "接收方关闭 channel。",
      pass: "关闭权属于发送方。",
    }),
    defineAntiPattern({
      fail: "在循环中使用 time.After 造成内存泄漏。",
      pass: "用 time.NewTimer + Reset 复用定时器。",
    }),
    defineAntiPattern({
      fail: "select 中缺少 ctx.Done() 分支。",
      pass: "始终包含 ctx.Done() 以防 goroutine 泄漏。",
    }),
    defineAntiPattern({
      fail: "wg.Add 放在 goroutine 内部。",
      pass: "Add 必须在 go 之前调用。",
    }),
    defineAntiPattern({
      fail: "mutex 持有期间跨越 I/O 调用。",
      pass: "临界区保持最短，I/O 前释放锁。",
    }),
    defineAntiPattern({
      fail: "不跑 race 检测就上线。",
      pass: "go test -race ./... 必须通过。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "高级 Go 并发模式：worker pool、fan-out/fan-in、pipeline 与 errgroup 编排。",
      loadWhen: "需要实现批量并行任务或复杂 goroutine 编排时读取。",
    }),
    defineReference({
      id: "channels-and-select",
      source: new URL("./references/channels-and-select.md", import.meta.url),
      target: "references/channels-and-select.md",
      title: "channels-and-select.md",
      summary: "Channel 通信模式：无缓冲/有缓冲、select 多路复用、超时与关闭信号。",
      loadWhen: "需要设计 channel 通信或排查 channel 相关死锁/泄漏时读取。",
    }),
    defineReference({
      id: "go-context-lifecycle",
      source: new URL("./references/go-context-lifecycle.md", import.meta.url),
      target: "references/go-context-lifecycle.md",
      title: "go-context-lifecycle.md",
      summary: "Context 生命周期管理：WithCancel、WithTimeout、WithValue 与取消传播链路。",
      loadWhen: "需要设计跨 goroutine 的取消、超时或请求级数据传递时读取。",
    }),
    defineReference({
      id: "sync-primitives",
      source: new URL("./references/sync-primitives.md", import.meta.url),
      target: "references/sync-primitives.md",
      title: "sync-primitives.md",
      summary: "同步原语详解：WaitGroup、Mutex、RWMutex、Once、Cond 与原子操作。",
      loadWhen: "需要选择或排查 Go 同步原语的使用场景与陷阱时读取。",
    }),
  ],
});
