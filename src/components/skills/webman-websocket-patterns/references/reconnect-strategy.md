# WebSocket 客户端重连策略

## 影响程度

**高**

## 问题

WebSocket 客户端（`AsyncTcpConnection`）断线后立即重连或无限重试，导致服务端故障时形成重连风暴（惊群效应），或者不重连导致服务永久中断。

## 为什么重要

- 服务端重启或网络闪断时，所有客户端几乎同时感知到断线。如果全部立即重连，瞬间并发量可能远超服务端容量。
- 指数退避（exponential backoff）+ 随机抖动（jitter）可以将重连请求分散到更长的时间窗口。
- 没有最大重试限制的重连会在服务端长期不可用时浪费资源。
- 重连期间如果不设 `isConnecting` 标记，`onClose` 和 `onError` 可能同时触发多个重连，创建重复连接。

## 错误示例

```php
<?php

declare(strict_types=1);

namespace App\WebSocket;

use Workerman\Connection\AsyncTcpConnection;

final class BadClient
{
    public function connect(string $url): void
    {
        $conn = new AsyncTcpConnection($url);

        $conn->onClose = function () use ($url): void {
            // 立即重连，无退避，无上限
            $this->connect($url);
        };

        $conn->onError = function () use ($url): void {
            // onError 和 onClose 都触发重连，可能创建两个连接
            $this->connect($url);
        };

        $conn->connect();
    }
}
```

## 正确示例

```php
<?php

declare(strict_types=1);

namespace App\WebSocket;

use Workerman\Connection\AsyncTcpConnection;
use Workerman\Timer;
use Workerman\Worker;

final class ResilientClient
{
    private ?AsyncTcpConnection $connection = null;
    private bool $isConnecting = false;
    private int $attempts = 0;
    private int $heartbeatTimerId = 0;

    private const MAX_ATTEMPTS = 10;
    private const BASE_DELAY = 1.0;
    private const MAX_DELAY = 60.0;
    private const JITTER_FACTOR = 0.1;

    public function __construct(
        private readonly string $url,
    ) {
    }

    public function onWorkerStart(Worker $worker): void
    {
        $this->connect();
    }

    public function onWorkerStop(Worker $worker): void
    {
        $this->stopHeartbeat();
        $this->connection?->close();
    }

    private function connect(): void
    {
        if ($this->isConnecting) {
            return;
        }

        $this->isConnecting = true;
        $conn = new AsyncTcpConnection($this->url);
        $conn->transport = 'ssl';

        $conn->onConnect = function (AsyncTcpConnection $conn): void {
            $this->isConnecting = false;
            $this->attempts = 0;
            $this->connection = $conn;
            $this->startHeartbeat();
        };

        $conn->onMessage = function (AsyncTcpConnection $conn, string $data): void {
            $this->handleMessage($data);
        };

        $conn->onClose = function (): void {
            $this->isConnecting = false;
            $this->stopHeartbeat();
            $this->connection = null;
            $this->scheduleReconnect();
        };

        $conn->onError = function (AsyncTcpConnection $conn, int $code, string $msg): void {
            Worker::log("WS error [{$code}]: {$msg}");
            $this->isConnecting = false;
        };

        $conn->connect();
    }

    private function scheduleReconnect(): void
    {
        $this->attempts++;

        if ($this->attempts > self::MAX_ATTEMPTS) {
            Worker::log('Max reconnect attempts reached: ' . $this->url);
            return;
        }

        // 指数退避
        $delay = self::BASE_DELAY * (2 ** ($this->attempts - 1));
        $delay = min($delay, self::MAX_DELAY);

        // 随机抖动
        $jitter = $delay * self::JITTER_FACTOR * (mt_rand(0, 100) / 100);
        $delay += $jitter;

        Worker::log("Reconnect attempt {$this->attempts} in {$delay}s");

        Timer::add($delay, function (): void {
            $this->connect();
        }, [], false);
    }

    private function startHeartbeat(): void
    {
        $this->heartbeatTimerId = Timer::add(30.0, function (): void {
            $this->connection?->send('{"event":"ping"}');
        });
    }

    private function stopHeartbeat(): void
    {
        if ($this->heartbeatTimerId > 0) {
            Timer::del($this->heartbeatTimerId);
            $this->heartbeatTimerId = 0;
        }
    }

    private function handleMessage(string $data): void
    {
    }
}
```

## 退避策略参数

| 参数 | 推荐值 | 说明 |
|------|--------|------|
| BASE_DELAY | 1-2 秒 | 首次重连等待 |
| MAX_DELAY | 30-60 秒 | 退避上限 |
| MAX_ATTEMPTS | 5-15 | 最大重试次数，超过后停止或告警 |
| JITTER_FACTOR | 0.1-0.3 | 抖动比例，分散重连压力 |

退避公式：`delay = min(BASE * 2^(attempt-1), MAX) + jitter`

## 健康检查

长时间运行的客户端还应增加周期性健康检查，检测连接是否假死（TCP 连接存在但服务端不响应）：

```php
<?php

declare(strict_types=1);

use Workerman\Timer;

// 每 60 秒检查一次连接是否健康
Timer::add(60.0, function () use (&$connection, &$lastPongTime): void {
    if ($connection !== null && (time() - $lastPongTime) > 90) {
        $connection->close();
    }
});
```

## 检测

**代码审查清单**

- [ ] 断线后是否有退避延迟而非立即重连？
- [ ] 退避是否包含随机抖动？
- [ ] 是否有最大重试次数限制？
- [ ] `isConnecting` 标记是否防止重复连接？
- [ ] `onError` 和 `onClose` 是否共用同一个重连入口而非各自触发？
- [ ] 重连成功后是否重置计数器？

## 相关规则

- [connection-lifecycle](./connection-lifecycle.md) — 服务端侧的连接管理
- [websocket-server-setup](./websocket-server-setup.md) — 服务端进程配置
