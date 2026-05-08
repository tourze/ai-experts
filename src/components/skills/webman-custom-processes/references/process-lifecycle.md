# 进程生命周期：初始化必须在 onWorkerStart 中

## 影响程度

**严重**

## 问题

在自定义进程的构造函数中创建数据库连接、Redis 连接、Timer 或其他有状态资源，导致 fork 后子进程继承父进程的连接句柄，引发连接冲突、数据错乱或段错误。

## 为什么重要

- Workerman 主进程先实例化 handler 类，再 fork 出子进程。构造函数中创建的连接会被所有子进程共享同一个文件描述符。
- 多个子进程同时读写同一个 socket 会导致数据交错（MySQL 连接互串、Redis 响应错位）。
- Timer 在主进程中创建后，fork 出的子进程继承的 timer 不受子进程事件循环管理，行为未定义。
- `onWorkerStart` 在每个子进程 fork 后独立调用，是唯一安全的初始化入口。

## 错误示例

```php
<?php

declare(strict_types=1);

namespace App\Process;

use support\Db;
use Workerman\Worker;

// 构造函数中初始化连接，fork 后所有子进程共享同一个 PDO 句柄
final class BadProcess
{
    private \PDO $pdo;

    public function __construct()
    {
        // 在主进程中执行，fork 后子进程继承这个连接
        $this->pdo = Db::connection()->getPdo();
    }

    public function onWorkerStart(Worker $worker): void
    {
        // 此时 $this->pdo 是和其他子进程共享的同一个连接
        $this->pdo->query('SELECT 1');
    }
}
```

## 正确示例

```php
<?php

declare(strict_types=1);

namespace App\Process;

use support\Db;
use Workerman\Worker;

final class GoodProcess
{
    private ?\PDO $pdo = null;

    public function onWorkerStart(Worker $worker): void
    {
        // fork 后在子进程中独立创建连接
        $this->pdo = Db::connection()->getPdo();
        $this->doWork();
    }

    public function onWorkerStop(Worker $worker): void
    {
        $this->pdo = null;
    }

    private function doWork(): void
    {
        // 安全：每个子进程持有独立连接
    }
}
```

## 完整进程声明示例

```php
<?php

declare(strict_types=1);

// config/process.php
return [
    'my-worker' => [
        'handler'    => \App\Process\GoodProcess::class,
        'count'      => 2,
        'reloadable' => true,
    ],
    'ws-server' => [
        'handler'    => \App\WebSocket\Server::class,
        'listen'     => 'websocket://0.0.0.0:8001',
        'count'      => (int) shell_exec('nproc'),
        'reloadable' => false,
        'reusePort'  => true,
    ],
];
```

关键配置项：
- `handler`：实现 `onWorkerStart` 的类。
- `count`：Worker 进程数。I/O 密集用 1，CPU 密集用 `cpu_count()`。
- `reloadable`：`true` 允许热重载（短连接），`false` 禁止（长连接进程）。
- `reusePort`：`true` 启用 `SO_REUSEPORT`，内核级多 Worker 负载均衡。
- `listen`：可选，指定监听地址（`tcp://`、`websocket://`、`http://`）。

## 检测

**代码审查清单**

- [ ] 构造函数中是否有 `new PDO`、`new Redis`、`Db::connection()`、`Timer::add()` 等调用？
- [ ] 所有有状态资源是否在 `onWorkerStart` 中创建？
- [ ] `onWorkerStop` 是否释放了 `onWorkerStart` 中创建的资源？
- [ ] `config/process.php` 是否为每个进程指定了合理的 `count` 和 `reloadable`？

## 相关规则

- [timer-management](./timer-management.md) — Timer 必须在 `onWorkerStart` 中创建
- [event-loop-blocking](./event-loop-blocking.md) — `onWorkerStart` 回调中也不可阻塞
- [crash-recovery](./crash-recovery.md) — 进程异常退出后的重启策略
