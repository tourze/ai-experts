# WebSocket 服务端搭建

## 影响程度

**高**

## 问题

WebSocket 进程声明缺少关键配置（`reloadable`、`reusePort`），或将 WebSocket 逻辑混入 HTTP 进程，导致热重载时断开所有长连接或多 Worker 负载不均。

## 为什么重要

- WebSocket 连接是长连接，Workerman 热重载（`SIGUSR1`）会重启 Worker 进程，如果 `reloadable => true`，所有 WebSocket 连接在重载时断开。
- 不设 `reusePort => true`，多个 Worker 进程通过单一 accept 竞争连接，导致负载不均和惊群效应。
- WebSocket 和 HTTP 应分开为独立进程组，各自配置 Worker 数量，避免 WebSocket 长连接占用 HTTP Worker。

## 错误示例

```php
<?php

declare(strict_types=1);

// config/process.php — 缺少关键配置
return [
    'ws' => [
        'handler' => \App\WebSocket\Server::class,
        'listen'  => 'websocket://0.0.0.0:8001',
        // 缺少 reloadable => false，热重载会断开所有连接
        // 缺少 reusePort，多 Worker 负载不均
        // 缺少 count，默认 1 个 Worker
    ],
];
```

## 正确示例

```php
<?php

declare(strict_types=1);

// config/process.php
return [
    'ws-server' => [
        'handler'    => \App\WebSocket\Server::class,
        'listen'     => 'websocket://0.0.0.0:8001',
        'count'      => (int) shell_exec('nproc'),
        'reloadable' => false,
        'reusePort'  => true,
        'constructor' => [
            'config' => config('app.websocket', []),
        ],
    ],
];
```

Handler 类基本结构：

```php
<?php

declare(strict_types=1);

namespace App\WebSocket;

use Workerman\Connection\TcpConnection;
use Workerman\Worker;

final class Server
{
    /** @param array<string, mixed> $config */
    public function __construct(
        private readonly array $config = [],
    ) {
    }

    public function onWorkerStart(Worker $worker): void
    {
        // 初始化连接存储、启动心跳定时器
    }

    public function onWorkerStop(Worker $worker): void
    {
        // 清理定时器和资源
    }

    public function onConnect(TcpConnection $connection): void
    {
        // 分配 Socket ID，注册握手回调
    }

    public function onMessage(TcpConnection $connection, mixed $data): void
    {
        // 解析消息，路由到对应处理器
    }

    public function onClose(TcpConnection $connection): void
    {
        // 清理连接关联的频道、定时器、状态
    }
}
```

## 同时提供 HTTP API

如果需要在 WebSocket 旁提供 REST API（如推送消息、查询在线用户），应声明独立的 HTTP 进程：

```php
<?php

declare(strict_types=1);

// config/process.php
return [
    'ws-server' => [
        'handler'    => \App\WebSocket\Server::class,
        'listen'     => 'websocket://0.0.0.0:8001',
        'count'      => (int) shell_exec('nproc'),
        'reloadable' => false,
        'reusePort'  => true,
    ],
    'ws-api' => [
        'handler'    => \App\WebSocket\ApiServer::class,
        'listen'     => 'http://0.0.0.0:8002',
        'count'      => (int) shell_exec('nproc'),
        'reloadable' => true,
        'reusePort'  => true,
    ],
];
```

## 检测

**代码审查清单**

- [ ] WebSocket 进程 `reloadable` 是否为 `false`？
- [ ] 多 Worker 时 `reusePort` 是否为 `true`？
- [ ] `count` 是否根据并发量合理设置？
- [ ] WebSocket 和 HTTP 是否分开为独立进程组？
- [ ] SSL 终结是否在反向代理层而非 Workerman 层？

## 相关规则

- [connection-lifecycle](connection-lifecycle.md) — 连接握手与认证
- [channel-subscription](channel-subscription.md) — 频道与跨进程广播
