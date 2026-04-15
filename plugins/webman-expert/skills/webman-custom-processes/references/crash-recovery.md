# Crash-and-Restart：让主进程负责重启

## 影响程度

**高**

## 问题

在自定义进程中用 `while(true) + try-catch + sleep` 循环包裹全部逻辑，试图"永不崩溃"，结果将一个应该快速失败的进程变成了不做事的僵尸。

## 为什么重要

- Workerman 主进程会自动重启异常退出的子进程，这是内建的监督机制。
- 在子进程中无限 try-catch 会掩盖根本问题：错误不会出现在日志中、不会触发告警、进程看似存活但不做任何有效工作。
- `sleep()` 在 try-catch 循环中会阻塞事件循环，所有 Timer 和连接处理全部停摆。
- 正确做法是：记录错误日志 → 调用 `Worker::stopAll()` 或让异常传播 → 主进程自动重启子进程。

## 错误示例

```php
<?php

declare(strict_types=1);

namespace App\Process;

use Workerman\Worker;

final class ZombieProcess
{
    public function onWorkerStart(Worker $worker): void
    {
        while (true) {
            try {
                $this->doWork();
                sleep(5);
            } catch (\Throwable $e) {
                // 吞掉异常，继续循环，进程变成僵尸
                sleep(10);
            }
        }
    }

    private function doWork(): void
    {
        throw new \RuntimeException('Service unavailable');
    }
}
```

## 正确示例

使用 `Worker::stopAll()` 让主进程重启子进程：

```php
<?php

declare(strict_types=1);

namespace App\Process;

use Workerman\Timer;
use Workerman\Worker;

final class ResilientProcess
{
    private int $timerId = 0;
    private int $retryInterval;

    public function __construct()
    {
        $this->retryInterval = 5;
    }

    public function onWorkerStart(Worker $worker): void
    {
        try {
            $this->initialize();
            $this->timerId = Timer::add(5.0, function (): void {
                $this->poll();
            });
        } catch (\Throwable $e) {
            Worker::log('Init failed: ' . $e->getMessage());
            $this->scheduleRestart();
        }
    }

    public function onWorkerStop(Worker $worker): void
    {
        if ($this->timerId > 0) {
            Timer::del($this->timerId);
        }
    }

    private function poll(): void
    {
        try {
            $this->doWork();
        } catch (\Throwable $e) {
            Worker::log('Poll failed: ' . $e->getMessage());
            Timer::del($this->timerId);
            $this->scheduleRestart();
        }
    }

    private function scheduleRestart(): void
    {
        // 延迟后停止当前 Worker，主进程会自动重启
        Timer::add((float) $this->retryInterval, function (): void {
            Worker::stopAll();
        }, [], false);
    }

    private function initialize(): void
    {
    }

    private function doWork(): void
    {
    }
}
```

## 恢复策略对比

| 策略 | 适用场景 | 风险 |
|------|---------|------|
| 异常传播（不捕获） | 进程内无需清理的简单 Worker | 安全，主进程自动重启 |
| 日志 + `Worker::stopAll()` | 需要清理资源后再退出 | 安全，可控延迟 |
| Timer 回调内捕获 + 跳过本次 | 单次轮询失败但不影响后续 | 适中，需设最大连续失败次数 |
| `while(true) + sleep` | **不适用于 Workerman** | 僵尸进程，阻塞事件循环 |

## 检测

**代码审查清单**

- [ ] 是否有 `while(true)` 循环包裹 `onWorkerStart` 的逻辑？
- [ ] catch 块中是否有 `sleep()`？
- [ ] 是否有 catch 块只做了日志但没有任何恢复动作（既不重启也不重试）？
- [ ] 连续失败是否有最大次数限制？

## 相关规则

- [process-lifecycle](process-lifecycle.md) — 进程生命周期与初始化
- [event-loop-blocking](event-loop-blocking.md) — sleep 在 catch 中同样阻塞事件循环
- [timer-management](timer-management.md) — 重启前清理定时器
