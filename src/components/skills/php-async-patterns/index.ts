import {
  InvocationPolicy,
  KnownTool,
  Platform,
  defineReference,
  defineSkill,
} from "../../sdk";
import { phpXFeaturesSkill } from "../php-8x-features/index";
import { phpErrorHandlingSkill } from "../php-error-handling/index";

export const phpAsyncPatternsSkill = defineSkill({
  id: "php-async-patterns",
  fullName: "PHP 异步模式",
  description: "当用户要在 PHP 中实现异步并发、使用 Swoole 协程/服务器、ReactPHP 事件循环、Amphp 或原生 Fibers 时使用。",
  useCases: [
    "需要 PHP 长驻进程（HTTP 服务器、WebSocket、任务 worker）。",
    "需要并发发起多个 HTTP/数据库请求以降低总延迟。",
    "在 Swoole、ReactPHP、Amphp 和原生 Fiber 之间做技术选型。",
  ],
  constraints: [
    "协程内不要做阻塞 I/O（file_get_contents、sleep）——用异步替代。",
    "协程间共享状态要用 Channel/Mutex，不要裸读写全局变量。",
    "长驻进程必须处理内存泄漏：清 static 缓存、限 max_request、用弱引用。",
    "WebSocket/TCP 连接要有心跳和超时。",
  ],
  checklist: [
    "选定的异步方案与项目的部署约束匹配。",
    "所有 I/O 都走异步客户端，无同步阻塞调用残留。",
    "协程间通信通过 Channel 或消息，没有裸全局变量共享。",
    "长驻进程有 max_request 或定期重启机制。",
  ],
  relatedSkills: [
    {
      get id() {
        return phpErrorHandlingSkill.id;
      },
      reason: "联动：`php-8x-features` · `php-error-handling`。",
    },
    {
      get id() {
        return phpXFeaturesSkill.id;
      },
      reason: "联动：`php-8x-features` · `php-error-handling`",
    },
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  body: new URL("./SKILL.body.md", import.meta.url),
  tools: [],
  references: [
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "Reference material for php-async-patterns.",
      loadWhen: "Read when the skill body points to this reference or the task needs the detailed material.",
    }),
  ],
});
