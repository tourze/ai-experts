# Crontab 调度：6 位表达式与进程模型

## 影响程度

**中等**

## 问题

在非 `onWorkerStart` 位置创建 Crontab 实例，或在 Crontab 回调中执行阻塞操作，导致定时任务不触发或冻结整个调度进程。

## 为什么重要

- `workerman/crontab` 依赖 Workerman 事件循环驱动，必须在 `onWorkerStart` 中创建才能正确注册到当前 Worker 的事件循环。
- Crontab 使用 6 位表达式（`秒 分 时 日 月 周`），比标准 5 位 cron 多了秒级精度，常见误用是把 5 位表达式直接传入。
- 如果 `count > 1`，每个 Worker 进程都会独立创建 Crontab 实例，同一个任务会被执行 N 次。调度进程通常只需 `count => 1`。
- Crontab 回调和 Timer 回调一样运行在事件循环中，阻塞会影响所有已注册的定时任务。

## 错误示例

```php
<?php

declare(strict_types=1);

namespace App\Process;

use Workerman\Crontab\Crontab;
use Workerman\Worker;

final class BadScheduler
{
    public function __construct()
    {
        // 在构造函数中创建，此时事件循环尚未启动
        new Crontab('0 0 * * *', function (): void {
            $this->cleanup();
        });
    }

    public function onWorkerStart(Worker $worker): void
    {
        new Crontab('0 0 0 * * *', function (): void {
            // 同步 HTTP 阻塞，其他 Crontab 任务全部暂停
            file_get_contents('http://api.example.com/report');
        });
    }

    private function cleanup(): void
    {
    }
}
```

## 正确示例

```php
<?php

declare(strict_types=1);

namespace App\Process;

use Webman\RedisQueue\Client;
use Workerman\Crontab\Crontab;
use Workerman\Worker;

final class TaskScheduler
{
    public function onWorkerStart(Worker $worker): void
    {
        // 6 位表达式：秒 分 时 日 月 周
        // 每天 00:00:00
        new Crontab('0 0 0 * * *', function (): void {
            $this->dailyCleanup();
        });

        // 每 5 分钟（第 0 秒）
        new Crontab('0 */5 * * * *', function (): void {
            $this->healthCheck();
        });

        // 每 30 秒
        new Crontab('*/30 * * * * *', function (): void {
            $this->frequentPoll();
        });
    }

    private function dailyCleanup(): void
    {
        // 耗时操作推入队列，不阻塞调度进程
        Client::send('daily-cleanup', ['date' => date('Y-m-d')]);
    }

    private function healthCheck(): void
    {
    }

    private function frequentPoll(): void
    {
    }
}
```

对应的进程声明：

```php
<?php

declare(strict_types=1);

// config/process.php
return [
    'scheduler' => [
        'handler' => \App\Process\TaskScheduler::class,
        'count'   => 1,
    ],
];
```

## 6 位 vs 5 位表达式

| 格式 | 字段 | 示例 | 含义 |
|------|------|------|------|
| 6 位 | 秒 分 时 日 月 周 | `0 0 0 * * *` | 每天 00:00:00 |
| 6 位 | 秒 分 时 日 月 周 | `*/30 * * * * *` | 每 30 秒 |
| 5 位（标准 cron） | 分 时 日 月 周 | `0 0 * * *` | **不兼容**，会被误解析 |

## 检测

**代码审查清单**

- [ ] Crontab 实例是否在 `onWorkerStart` 中创建？
- [ ] 表达式是否为 6 位（含秒）？
- [ ] 调度进程的 `count` 是否为 1？
- [ ] 回调中是否有阻塞操作？耗时任务是否推入队列？

## 相关规则

- [process-lifecycle](./process-lifecycle.md) — 所有初始化在 onWorkerStart 中
- [event-loop-blocking](./event-loop-blocking.md) — Crontab 回调同样不可阻塞
