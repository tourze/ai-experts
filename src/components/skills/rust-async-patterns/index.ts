import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
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
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "advanced-patterns",
      source: new URL("./references/advanced-patterns.md", import.meta.url),
      target: "references/advanced-patterns.md",
      title: "advanced-patterns.md",
      summary: "Reference material for rust-async-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
