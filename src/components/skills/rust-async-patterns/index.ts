import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillGoal,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const rustAsyncPatternsSkill = defineSkill({
  id: "rust-async-patterns",
  fullName: "Rust Async Patterns",
  description: "当用户需要开发或排障 Tokio 异步代码时使用；涉及 tokio::spawn、JoinSet、channel、select! 或异步生命周期时触发。",
  useCases: [
    "构建基于 Tokio 的网络服务、worker、任务编排器或后台轮询器。",
    "排查 `future is not Send`、`spawn` 要求 `'static`、任务泄漏、取消不生效、超时缺失、锁跨 `await` 等问题。",
    "需要确定 channel、`JoinSet`、`Semaphore`、`CancellationToken`、`select!` 的使用边界时。",
  ],
  constraints: [
    "`tokio::spawn` 只接受 `Send + 'static` future。拿不出 `'static` 所有权时，先重画数据边界。",
    "async 代码里禁止直接做阻塞工作；CPU 密集或同步 IO 用 `spawn_blocking`。",
    "锁的持有范围必须短于 `await`。需要跨异步边界共享状态时，优先消息传递。",
    "并发必须有上限：`JoinSet` 负责收尸，`Semaphore` 负责限流，channel 容量负责背压。",
    "诊断顺序固定：先确认任务是谁 spawn 的 → 看取消信号有没有传到 → 看是否有阻塞/锁跨 `await`。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "async 里做阻塞",
      pass: "tokio 异步 API / spawn_blocking：MutexGuard 跨 await 的反模式见 [references/advanced-patterns.md](references/advanced-patterns.md)。",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  goal: defineSkillGoal({
    body: "开发和排障 Tokio 异步任务、channel、select、限流、取消、超时、锁边界和 Send / 'static 生命周期问题。",
  }),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认任务是谁 spawn 的、数据所有权如何进入 `'static` future、取消信号是否能传到每个分支。",
      "为并发设置上限：JoinSet 收尸，Semaphore 限流，channel 容量提供背压。",
      "检查阻塞工作、锁跨 await、任务泄漏、超时缺失和 future is not Send 编译错误。",
      "JoinSet / Semaphore 和 CancellationToken 示例读取 `runtime-examples`；阻塞、死锁和 Send 陷阱读取 `advanced-patterns`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "任务边界、所有权迁移、限流、背压、取消和超时设计。",
      "Send / 'static / 锁跨 await / 阻塞路径诊断结论。",
      "需要修改的 async API 边界、测试建议和剩余风险。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "runtime-examples",
      source: new URL("./references/runtime-examples.md", import.meta.url),
      target: "references/runtime-examples.md",
      title: "Rust Async Runtime Examples",
      summary: "JoinSet + Semaphore 限流并发和 CancellationToken 停机传播示例。",
      loadWhen: "需要快速套用 Tokio 限流并发或取消传播模式时读取。",
    }),
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "MutexGuard 跨 await、阻塞 async 与任务泄漏等常见陷阱的详细代码示例与修复方案。",
      loadWhen: "需要排查 async 代码中的阻塞、死锁或 Send 编译错误时读取。",
    }),
  ],
});
