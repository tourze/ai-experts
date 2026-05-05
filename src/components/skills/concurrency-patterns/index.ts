import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
} from "../../sdk";

export const concurrencyPatternsSkill = defineSkill({
  id: "concurrency-patterns",
  fullName: "并发模式",
  description: "当需要设计或审查并发/异步代码时使用。语言无关的通用并发原则：不阻塞、限制并发、传播取消、不共享可变状态、超时所有外部调用。",
  useCases: [
    "需要设计异步任务、并发请求、事件循环或后台 worker。",
    "需要排查竞态条件、死锁、goroutine/task 泄漏或内存可见性问题。",
    "需要在各语言落地时加载对应语言 skill：各语言版提供具体语法和惯用写法。",
  ],
  constraints: [
    "**不阻塞异步上下文**：异步代码路径中禁止同步 I/O 或长时间计算；大计算用专用线程池/worker 隔离。",
    "**限制并发**：用信号量/errgroup/JoinSet 绑上限，避免无界并发打垮下游。",
    "**传播取消**：取消信号必须从入口传到所有子任务；子任务收到取消后尽快退出，不启动新工作。",
    "**不共享可变状态**：跨并发上下文用消息传递/channel；必须共享时用锁保护，但优先消息传递。",
    "**超时所有外部调用**：HTTP/RPC/DB/消息队列都设超时，不设默认无限等待。",
    "**生命周期管理**：每个并发任务有明确 owner 和退出路径；不泄漏 goroutine/coroutine/task。",
    "**优雅停机**：监听信号 → 停止接受新工作 → 在超时内排空进行中任务。",
  ],
  checklist: [
    "所有外部调用是否都有超时。",
    "并发数是否有上限，不会无界增长。",
    "取消信号是否从入口传播到所有子任务。",
    "跨并发边界是否避免了共享可变状态。",
    "每个并发任务是否有明确的退出路径。",
    "优雅停机是否覆盖了所有长生命周期任务。",
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
