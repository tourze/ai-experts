import {
  InvocationPolicy,
  Platform,
  defineReference,
  defineAntiPattern,
  defineSkill,
  defineSkillOutputs,
  defineSkillWorkflow,
} from "../../sdk";

export const webmanCustomProcessesSkill = defineSkill({
  id: "webman-custom-processes",
  fullName: "Webman Custom Processes",
  description: "当用户要声明或排查 Webman 自定义进程、Timer、Crontab 或 crash-restart 时使用。",
  useCases: [
    "声明后台 Worker、心跳、定时任务。",
    "排查进程阻塞、Timer 不触发。",
    "实现 crash-restart 或优雅停机。",
  ],
  constraints: [
    "初始化放 `onWorkerStart`，构造函数禁止副作用。见 [process-lifecycle](references/process-lifecycle.md)。",
    "Timer ID 必须追踪，`onWorkerStop` 清理。见 [timer-management](references/timer-management.md)。",
    "回调禁止 `sleep()`、同步阻塞。见 [event-loop-blocking](references/event-loop-blocking.md)。",
    "不可恢复错误用 `Worker::stopAll()`。见 [crash-recovery](references/crash-recovery.md)。",
    "Crontab 6 位表达式，`onWorkerStart` 中创建。见 [crontab-scheduling](references/crontab-scheduling.md)。",
  ],
  checklist: [
    "`config/process.php` 声明 `handler` 和 `count`",
    "初始化在 `onWorkerStart`",
    "Timer ID 追踪并清理",
    "回调无阻塞调用",
    "长连接进程 `reloadable=>false`",
  ],
  antiPatterns: [
    defineAntiPattern({
      fail: "构造函数建连接",
      pass: "onWorkerStart 初始化",
    }),
    defineAntiPattern({
      fail: "Timer 不清理",
      pass: "追踪 + onWorkerStop 清理",
    }),
    defineAntiPattern({
      fail: "回调 sleep",
      pass: "异步等待",
    }),
  ],
  invocation: InvocationPolicy.ImplicitAndExplicit,
  platforms: [Platform.Claude, Platform.Codex],
  sourceDir: new URL("./", import.meta.url),
  workflow: defineSkillWorkflow({
    steps: [
      "先确认进程用途、`config/process.php` handler、count、是否长连接、是否可 reload 和停止语义。",
      "生命周期初始化读取 `process-lifecycle` reference，连接和资源放在 `onWorkerStart`。",
      "Timer/Crontab 读取 `timer-management` 与 `crontab-scheduling`，追踪 Timer ID 并在 `onWorkerStop` 清理。",
      "排查阻塞读取 `event-loop-blocking`，移除 `sleep()` 和同步阻塞调用。",
      "崩溃恢复读取 `crash-recovery`，不可恢复错误用 `Worker::stopAll()` 或明确退出策略。",
      "输出 process 配置、生命周期钩子、清理逻辑和验证命令。",
    ],
  }),
  outputs: defineSkillOutputs({
    items: [
      "`config/process.php` 进程声明和 handler/count/reloadable 设置。",
      "onWorkerStart/onWorkerStop 生命周期设计。",
      "Timer/Crontab 管理、阻塞风险和崩溃恢复策略。",
      "验证步骤、日志观察点和回滚方案。",
    ],
  }),
  references: [
    defineReference({
      id: "crash-recovery",
      source: new URL("./references/crash-recovery.md", import.meta.url),
      target: "references/crash-recovery.md",
      title: "crash-recovery.md",
      summary: "Webman 进程崩溃恢复策略，包括不可恢复错误的处理与 Worker 优雅停止。",
      loadWhen: "需要实现进程崩溃后的自动恢复或 Worker 优雅重启时读取。",
    }),
    defineReference({
      id: "crontab-scheduling",
      source: new URL("./references/crontab-scheduling.md", import.meta.url),
      target: "references/crontab-scheduling.md",
      title: "crontab-scheduling.md",
      summary: "Webman 定时任务（Crontab）的 6 位表达式配置与生命周期管理。",
      loadWhen: "需要在自定义进程中配置定时任务或排查 Crontab 不触发问题时读取。",
    }),
    defineReference({
      id: "event-loop-blocking",
      source: new URL("./references/event-loop-blocking.md", import.meta.url),
      target: "references/event-loop-blocking.md",
      title: "event-loop-blocking.md",
      summary: "Webman 事件循环阻塞的分析方法，包括 sleep() 和同步调用的检测与替代方案。",
      loadWhen: "需要排查进程因阻塞导致 Timer 不触发或请求超时问题时读取。",
    }),
    defineReference({
      id: "process-lifecycle",
      source: new URL("./references/process-lifecycle.md", import.meta.url),
      target: "references/process-lifecycle.md",
      title: "process-lifecycle.md",
      summary: "Webman 自定义进程生命周期详解，包括 onWorkerStart、onWorkerStop 和连接管理。",
      loadWhen: "需要设计自定义进程的初始化与清理逻辑，或排查进程启动失败时读取。",
    }),
    defineReference({
      id: "timer-management",
      source: new URL("./references/timer-management.md", import.meta.url),
      target: "references/timer-management.md",
      title: "timer-management.md",
      summary: "Webman Timer 的管理规范，包括 Timer ID 追踪、清理和常见陷阱。",
      loadWhen: "需要实现心跳定时器或排查 Timer 泄漏/不触发问题时读取。",
    }),
  ],
});
