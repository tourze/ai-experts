import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineAntiPattern,
  defineReference,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const asyncPythonPatternsSkill = defineSkill({
  id: "async-python-patterns",
  fullName: "Python 异步模式",
  description: "当用户要实现 asyncio、async/await、TaskGroup、timeout、cancellation、并发 I/O 或异步 API 时使用。",
  useCases: [
    "构建 FastAPI、aiohttp、WebSocket 或其他高并发异步接口。",
    "并发执行数据库、HTTP、文件等 I/O 操作。",
    "需要为异步代码补齐 timeout、cancellation、backpressure 和并发上限。",
  ],
  constraints: [
    "同一条调用链保持\"全同步\"或\"全异步\"，不要混入偷偷阻塞的同步 I/O。",
    "CPU 密集任务不能直接塞进事件循环；用 `asyncio.to_thread()` 或进程池。",
    "优先使用结构化并发（`asyncio.TaskGroup`）；只有明确接受脱管任务时才做 fire-and-forget。",
    "异步代码里不要出现 `time.sleep()`、同步 ORM 客户端或无界 `asyncio.gather()`。",
  ],
  checklist: [
    "已明确哪些步骤是真异步 I/O，哪些是 CPU 或同步阻塞。",
    "每个外部依赖都具备 timeout、重试边界和错误传播策略。",
    "已限制并发度。",
    "任务生命周期可追踪，退出时没有悬空 task。",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "async 函数里调同步阻塞",
      pass: "用异步客户端或 to_thread",
    }),
    defineAntiPattern({
      fail: "无限并发",
      pass: "信号量限流",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认调用链是全同步还是全异步，标出外部 I/O、CPU 密集步骤和可能阻塞的库。",
      "用 TaskGroup 管理子任务生命周期，用 timeout 包住外部边界，用 Semaphore 或队列限制并发。",
      "取消路径必须可传播，CPU 密集任务移到 `asyncio.to_thread()` 或进程池。",
      "TaskGroup、timeout 和信号量代码模式读取 `taskgroup-patterns`。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "异步边界、并发度、timeout、取消传播和阻塞风险清单。",
      "TaskGroup / semaphore / queue / to_thread 的实现建议。",
      "需要补的异步测试、泄漏验证和错误传播验证。",
    ],
  }),
  tools: [],
  references: [
    defineReference({
      id: "taskgroup-patterns",
      source: new URL("./references/taskgroup-patterns.md", import.meta.url),
      target: "references/taskgroup-patterns.md",
      title: "asyncio TaskGroup 模式",
      summary: "TaskGroup、Semaphore 和 asyncio.timeout 的结构化并发示例。",
      loadWhen: "需要快速实现 asyncio 限流并发或 timeout 边界时读取。",
    }),
  ],
});
