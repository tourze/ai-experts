import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
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
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认任务所有者、取消路径、并发上限、结果收集和错误传播策略。",
      "优先用 errgroup + context 管理先失败先取消；worker pool 必须有界并可关闭。",
      "检查 goroutine 泄漏、无缓冲阻塞、锁粒度、channel 关闭方和 context 传递边界。",
      "errgroup / worker pool 速查读取 `runtime-patterns`；fan-out、context、channel、sync 深入读取对应 references。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "goroutine 生命周期、取消传播、并发上限和错误收敛方案。",
      "channel / worker pool / sync primitive 使用边界和泄漏风险。",
      "需要补的 race 测试、超时测试和观测点。",
    ],
  }),
  references: [
    defineReference({
      id: "runtime-patterns",
      source: new URL("./references/runtime-patterns.md", import.meta.url),
      target: "references/runtime-patterns.md",
      title: "Go 并发运行时模式",
      summary: "errgroup + SetLimit、有界 worker pool 和 pipeline 的快速代码模式。",
      loadWhen: "需要快速套用 Go 限流并发或 worker pool 模式时读取。",
    }),
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
