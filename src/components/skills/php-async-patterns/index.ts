import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineWorkflow,
  defineWorkflowStep,
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
      reason: "异步 worker、长驻服务和外部 I/O 需要异常映射、重试边界或失败治理时联动。",
    },
    {
      get id() {
        return phpXFeaturesSkill.id;
      },
      reason: "需要 Fiber、readonly、enum 或现代语法支撑异步代码结构时联动。",
    },
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "协程内 sleep()",
      pass: "Coroutine::sleep",
    }),
    defineAntiPattern({
      fail: "协程裸读写共享变量",
      pass: "Channel 通信",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineWorkflow({
    steps: [
      defineWorkflowStep({
        id: "step-1",
        label: "先确认部署是否允许 C 扩展、是否需要内置 HTTP/WebSocket 服务器、并发 I/O 类型和长期运行时长。",
      }),
      defineWorkflowStep({
        id: "step-2",
        label: "按 Swoole、ReactPHP、Amphp、原生 Fiber 的约束选择方案，避免把同步阻塞 I/O 混进协程。",
      }),
      defineWorkflowStep({
        id: "step-3",
        label: "协程间共享状态必须通过 Channel / Mutex / 消息边界，长驻进程要设计 max_request、心跳、超时和清理策略。",
      }),
      defineWorkflowStep({
        id: "step-4",
        label: "运行时选型矩阵读取 `runtime-selection`；具体协程、Channel、定时器和并发控制代码读取 `patterns`。",
      }),
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "异步运行时选择、部署约束、阻塞 I/O 风险和并发模型。",
      "Channel / Mutex / 心跳 / timeout / max_request 设计建议。",
      "需要补的压力测试、泄漏观测和异常治理。",
    ],
  }),
  references: [
    defineReference({
      id: "runtime-selection",
      source: new URL("./references/runtime-selection.md", import.meta.url),
      target: "references/runtime-selection.md",
      title: "PHP 异步运行时选型",
      summary: "Swoole、ReactPHP、Amphp 和原生 Fiber 的能力、扩展要求和适用场景矩阵。",
      loadWhen: "需要在 PHP 异步运行时之间做技术选型时读取。",
    }),
    defineReference({
      id: "patterns",
      source: new URL("./references/patterns.md", import.meta.url),
      target: "references/patterns.md",
      title: "patterns.md",
      summary: "PHP 异步编程常用模式汇总，包括协程、Channel、定时器、并发控制等。",
      loadWhen: "需要查阅 PHP 异步编程的具体代码模式或实现示例时读取。",
    }),
  ],
});
