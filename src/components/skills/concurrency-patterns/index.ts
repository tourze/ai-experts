import {
  InvocationPolicy,
  Platform,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
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
  antiPatterns: [
    defineAntiPattern({
      fail: "异步上下文里做同步阻塞",
      pass: "异步 I/O + 大计算隔离",
    }),
    defineAntiPattern({
      fail: "无界并发",
      pass: "信号量限流",
    }),
    defineAntiPattern({
      fail: "不设超时",
      pass: "带超时",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先画出入口、子任务、外部依赖、共享状态和长期运行任务，明确每个任务的 owner。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "为任务队列、worker 池或批量请求设置并发上限；溢出策略在排队、背压和快速失败中明确选择。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "把 timeout/cancel 信号从入口传给所有子任务，并检查每个 await/yield/select 点能退出。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "跨并发边界优先消息传递；必须共享可变状态时写清锁范围、顺序和死锁规避。",
      }),
      defineWorkflowStep({
        id: "step-5",
        label: "设计优雅停机：收到信号后停止接收新工作、在超时内排空、关闭连接池并刷新缓冲。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "并发拓扑：入口、队列、worker、外部依赖、共享状态和任务 owner。",
      "限流策略、取消传播路径、超时策略、共享状态保护方式和泄漏风险。",
      "优雅停机顺序、排空超时、失败/背压行为和需要语言特化 skill 补充的实现点。",
    ],
  }),
});
