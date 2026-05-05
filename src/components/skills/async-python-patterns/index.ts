import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineSkill,
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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
