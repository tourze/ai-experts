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
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
});
