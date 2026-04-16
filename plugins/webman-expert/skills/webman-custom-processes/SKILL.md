---
name: webman-custom-processes
description: 当用户要声明或排查 Webman 自定义进程、Timer、Crontab 或 crash-restart 时使用。
---

自定义进程声明与运行时约束。

## 适用场景

- 声明后台 Worker、心跳、定时任务。
- 排查进程阻塞、Timer 不触发。
- 实现 crash-restart 或优雅停机。

## 核心约束

- 初始化放 `onWorkerStart`，构造函数禁止副作用。见 [process-lifecycle](references/process-lifecycle.md)。
- Timer ID 必须追踪，`onWorkerStop` 清理。见 [timer-management](references/timer-management.md)。
- 回调禁止 `sleep()`、同步阻塞。见 [event-loop-blocking](references/event-loop-blocking.md)。
- 不可恢复错误用 `Worker::stopAll()`。见 [crash-recovery](references/crash-recovery.md)。
- Crontab 6 位表达式，`onWorkerStart` 中创建。见 [crontab-scheduling](references/crontab-scheduling.md)。


## 代码模式

```php
<?php
// config/process.php
return ['heartbeat' => ['handler' => App\Process\Heartbeat::class, 'count' => 1]];
```

## 检查清单

- [ ] `config/process.php` 声明 `handler` 和 `count`
- [ ] 初始化在 `onWorkerStart`
- [ ] Timer ID 追踪并清理
- [ ] 回调无阻塞调用
- [ ] 长连接进程 `reloadable=>false`

## 反模式

- 构造函数初始化连接 → fork 冲突。见 [process-lifecycle](references/process-lifecycle.md)。
- Timer 不清理 → 访问已销毁对象。见 [timer-management](references/timer-management.md)。
- 回调 `sleep()` → 冻结 Worker。见 [event-loop-blocking](references/event-loop-blocking.md)。
- 无限 try-catch → 僵尸进程。见 [crash-recovery](references/crash-recovery.md)。

