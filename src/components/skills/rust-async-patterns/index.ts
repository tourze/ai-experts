import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
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
