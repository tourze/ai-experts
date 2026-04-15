# 连接生命周期：握手、认证、心跳与清理

## 影响程度

**严重**

## 问题

WebSocket 连接在 `onConnect` 后直接参与业务逻辑而不经过认证握手，或在 `onClose` 时不清理关联资源（频道订阅、定时器、状态存储），导致未授权访问和资源泄漏。

## 为什么重要

- `onConnect` 时 WebSocket 握手尚未完成，此时连接是裸 TCP，不能发送 WebSocket 帧。
- `onWebSocketConnect` 是握手完成后的回调，是执行认证的正确时机。
- 认证失败的连接如果立即 `close()`，可能与正在处理的 `onMessage` 产生竞态。正确做法是 `pauseRecv()` 暂停接收，由心跳定时器统一回收。
- `onClose` 不清理频道订阅会导致广播时向已关闭的 socket 写数据。

## 错误示例

```php
<?php

declare(strict_types=1);

namespace App\WebSocket;

use Workerman\Connection\TcpConnection;

final class UnsafeServer
{
    /** @var array<string, TcpConnection> */
    private array $connections = [];

    public function onConnect(TcpConnection $connection): void
    {
        // 未认证就加入连接池
        $this->connections[spl_object_id($connection)] = $connection;
    }

    public function onClose(TcpConnection $connection): void
    {
        // 只从连接池移除，未清理频道订阅和定时器
        unset($this->connections[spl_object_id($connection)]);
    }
}
```

## 正确示例

```php
<?php

declare(strict_types=1);

namespace App\WebSocket;

use Workerman\Connection\TcpConnection;
use Workerman\Timer;
use Workerman\Worker;

final class SafeServer
{
    private const UNKNOWN_TAG = '__unknown__';

    /** @var array<string, array<string, TcpConnection>> appKey => [socketId => conn] */
    private array $connections = [];

    private int $heartbeatTimerId = 0;

    public function onWorkerStart(Worker $worker): void
    {
        $this->heartbeatTimerId = Timer::add(30.0, function (): void {
            $this->checkHeartbeats();
        });
    }

    public function onWorkerStop(Worker $worker): void
    {
        Timer::del($this->heartbeatTimerId);
    }

    public function onConnect(TcpConnection $connection): void
    {
        $socketId = bin2hex(random_bytes(16));
        $connection->socketId = $socketId;
        $connection->missedPings = 0;
        $connection->subscribedChannels = [];
        $connection->authenticated = false;

        // 暂存到未认证区
        $this->connections[self::UNKNOWN_TAG][$socketId] = $connection;

        // 握手完成后认证
        $connection->onWebSocketConnect = function (TcpConnection $conn, string $header) use ($socketId): void {
            $this->authenticate($conn, $header, $socketId);
        };
    }

    public function onMessage(TcpConnection $connection, mixed $data): void
    {
        if (!($connection->authenticated ?? false)) {
            return;
        }

        $connection->missedPings = 0;
        // 路由消息到业务处理
    }

    public function onClose(TcpConnection $connection): void
    {
        $socketId = $connection->socketId ?? '';
        $appKey = $connection->appKey ?? self::UNKNOWN_TAG;

        // 清理频道订阅
        foreach ($connection->subscribedChannels ?? [] as $channel) {
            unset($this->connections[$channel][$socketId]);
        }

        // 清理连接级定时器
        if (isset($connection->heartbeatTimerId)) {
            Timer::del($connection->heartbeatTimerId);
        }

        // 从连接池移除
        unset($this->connections[$appKey][$socketId]);
    }

    private function authenticate(TcpConnection $connection, string $header, string $socketId): void
    {
        // 从 URL 或 header 提取 token，验证失败暂停接收
        $token = $this->extractToken($header);

        if (!$this->isValidToken($token)) {
            $connection->send(json_encode(['error' => 'Unauthorized']));
            $connection->pauseRecv();
            return;
        }

        $appKey = $this->resolveAppKey($token);
        $connection->appKey = $appKey;
        $connection->authenticated = true;

        unset($this->connections[self::UNKNOWN_TAG][$socketId]);
        $this->connections[$appKey][$socketId] = $connection;

        $connection->send(json_encode(['event' => 'connected', 'socket_id' => $socketId]));
    }

    private function checkHeartbeats(): void
    {
        foreach ($this->connections as $group => $conns) {
            foreach ($conns as $socketId => $conn) {
                $conn->missedPings = ($conn->missedPings ?? 0) + 1;
                if ($conn->missedPings > 2) {
                    $conn->close();
                }
            }
        }
    }

    private function extractToken(string $header): string
    {
        return '';
    }

    private function isValidToken(string $token): bool
    {
        return $token !== '';
    }

    private function resolveAppKey(string $token): string
    {
        return 'default';
    }
}
```

## 连接生命周期流程

```
onConnect
  ├── 分配 socketId
  ├── 初始化属性 (missedPings=0, authenticated=false)
  └── 存入 __unknown__ 区
        │
        ▼
onWebSocketConnect (握手完成)
  ├── 提取认证信息
  ├── 验证成功 → 移入正式连接池，标记 authenticated=true
  └── 验证失败 → pauseRecv()，等待心跳回收
        │
        ▼
onMessage (已认证连接)
  ├── 重置 missedPings
  └── 路由到业务处理
        │
        ▼
onClose
  ├── 清理频道订阅
  ├── 清理连接级定时器
  └── 从连接池移除
```

## 检测

**代码审查清单**

- [ ] 是否在 `onWebSocketConnect`（而非 `onConnect`）中做认证？
- [ ] 认证失败是否用 `pauseRecv()` 而非立即 `close()`？
- [ ] `onClose` 是否清理了频道订阅、定时器和所有关联状态？
- [ ] 连接属性是否在 `onConnect` 中初始化默认值？
- [ ] 心跳检测是否使用 graduated timeout（missedPings > N）？

## 相关规则

- [websocket-server-setup](websocket-server-setup.md) — 进程声明与配置
- [channel-subscription](channel-subscription.md) — 频道订阅与清理
- [reconnect-strategy](reconnect-strategy.md) — 客户端侧的重连
