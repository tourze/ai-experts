# Timer 定时器：追踪 ID 并主动清理

## 影响程度

**高**

## 问题

`Timer::add()` 创建定时器后不保存返回的 timer ID，导致进程停止或连接断开时无法清理，泄漏的回调持续执行并访问已销毁的对象。

## 为什么重要

- 泄漏的定时器回调会持续运行，访问已关闭的连接、已释放的资源，触发警告或段错误。
- 每个未清理的定时器占用事件循环资源，进程长期运行后定时器数量无限增长，导致 CPU 空转和内存泄漏。
- 连接断开后关联的心跳定时器如果不删除，会尝试向已关闭的 socket 发送数据。

## 错误示例

```php
<?php

declare(strict_types=1);

namespace App\Process;

use Workerman\Timer;
use Workerman\Worker;

final class LeakyProcess
{
    public function onWorkerStart(Worker $worker): void
    {
        // timer ID 被丢弃，无法清理
        Timer::add(5.0, function (): void {
            $this->poll();
        });

        Timer::add(30.0, function (): void {
            $this->heartbeat();
        });
    }

    public function onWorkerStop(Worker $worker): void
    {
        // 无法清理，因为没有保存 timer ID
    }

    private function poll(): void
    {
    }

    private function heartbeat(): void
    {
    }
}
```

## 正确示例

```php
<?php

declare(strict_types=1);

namespace App\Process;

use Workerman\Timer;
use Workerman\Worker;

final class CleanProcess
{
    /** @var list<int> */
    private array $timerIds = [];

    public function onWorkerStart(Worker $worker): void
    {
        $this->timerIds[] = Timer::add(5.0, function (): void {
            $this->poll();
        });

        $this->timerIds[] = Timer::add(30.0, function (): void {
            $this->heartbeat();
        });
    }

    public function onWorkerStop(Worker $worker): void
    {
        foreach ($this->timerIds as $id) {
            Timer::del($id);
        }

        $this->timerIds = [];
    }

    private function poll(): void
    {
    }

    private function heartbeat(): void
    {
    }
}
```

## 连接级定时器清理

当定时器与特定连接关联时，必须在连接关闭时清理：

```php
<?php

declare(strict_types=1);

namespace App\WebSocket;

use Workerman\Connection\TcpConnection;
use Workerman\Timer;

final class ConnectionTimerExample
{
    public function onConnect(TcpConnection $connection): void
    {
        $timerId = Timer::add(30.0, function () use ($connection): void {
            $connection->send('ping');
        });

        // 将 timer ID 存储在连接对象上
        $connection->heartbeatTimerId = $timerId;
    }

    public function onClose(TcpConnection $connection): void
    {
        if (isset($connection->heartbeatTimerId)) {
            Timer::del($connection->heartbeatTimerId);
        }
    }
}
```

## 一次性定时器

`Timer::add()` 第三个参数 `$args` 默认为空数组，第四个参数 `$persistent` 为 `true`。传 `false` 创建一次性延迟定时器：

```php
<?php

declare(strict_types=1);

use Workerman\Timer;

// 5 秒后执行一次
Timer::add(5.0, function (): void {
    echo 'delayed task';
}, [], false);
```

## 检测

**代码审查清单**

- [ ] 每个 `Timer::add()` 的返回值是否被保存？
- [ ] `onWorkerStop` 是否调用了 `Timer::del()` 清理所有定时器？
- [ ] 连接级定时器是否在 `onClose` 中清理？
- [ ] 是否有定时器回调引用了可能被销毁的外部对象（连接、文件句柄）？

## 相关规则

- [process-lifecycle](./process-lifecycle.md) — Timer 必须在 `onWorkerStart` 中创建
- [event-loop-blocking](./event-loop-blocking.md) — Timer 回调不可阻塞
