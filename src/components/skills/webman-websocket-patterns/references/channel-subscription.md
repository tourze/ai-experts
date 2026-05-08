# 频道订阅与跨进程广播

## 影响程度

**严重**

## 问题

多 Worker 部署时只用进程内数组存储频道订阅关系，导致不同 Worker 上的客户端无法互相收到消息；或在单进程场景下过度引入 Redis pub/sub 增加复杂度。

## 为什么重要

- Workerman `count > 1` 时，每个 Worker 进程有独立的内存空间。客户端 A 连到 Worker 1、客户端 B 连到 Worker 2，Worker 1 内的频道数组对 Worker 2 不可见。
- 跨进程广播必须通过外部通道（Redis pub/sub、Workerman Channel 组件、共享内存）。
- 私有频道（`private-`）和 Presence 频道（`presence-`）需要服务端签名验证，否则任何客户端都能订阅任意频道。

## 错误示例

```php
<?php

declare(strict_types=1);

namespace App\WebSocket;

use Workerman\Connection\TcpConnection;

// 多 Worker 部署，只用进程内数组 → 跨进程消息丢失
final class BrokenBroadcast
{
    /** @var array<string, array<string, TcpConnection>> */
    private array $channels = [];

    public function onMessage(TcpConnection $connection, mixed $data): void
    {
        $msg = json_decode((string) $data, true);

        if (($msg['event'] ?? '') === 'publish') {
            $channel = $msg['channel'] ?? '';
            // 只能发送到当前 Worker 的订阅者
            foreach ($this->channels[$channel] ?? [] as $conn) {
                $conn->send((string) $data);
            }
        }
    }
}
```

## 正确示例

使用 Redis pub/sub 做跨进程广播：

```php
<?php

declare(strict_types=1);

namespace App\WebSocket;

use Workerman\Connection\TcpConnection;
use Workerman\Redis\Client as RedisClient;
use Workerman\Worker;

final class CrossProcessBroadcast
{
    /** @var array<string, array<string, TcpConnection>> channel => [socketId => conn] */
    private array $localChannels = [];
    private ?RedisClient $subscriber = null;
    private ?RedisClient $publisher = null;
    private const INTERNAL_CHANNEL = 'ws:broadcast';

    public function onWorkerStart(Worker $worker): void
    {
        $this->publisher = new RedisClient('redis://127.0.0.1:6379');

        $this->subscriber = new RedisClient('redis://127.0.0.1:6379');
        $this->subscriber->subscribe(self::INTERNAL_CHANNEL, function (string $channel, string $message): void {
            $this->deliverLocally(json_decode($message, true));
        });
    }

    public function subscribe(TcpConnection $connection, string $channel): void
    {
        $socketId = $connection->socketId ?? '';
        $this->localChannels[$channel][$socketId] = $connection;
        $connection->subscribedChannels[] = $channel;
    }

    public function publish(string $channel, array $data, string $excludeSocketId = ''): void
    {
        $payload = json_encode([
            'channel' => $channel,
            'data'    => $data,
            'exclude' => $excludeSocketId,
        ]);

        // 通过 Redis pub/sub 发送到所有 Worker
        $this->publisher->publish(self::INTERNAL_CHANNEL, $payload);
    }

    private function deliverLocally(?array $payload): void
    {
        if ($payload === null) {
            return;
        }

        $channel = $payload['channel'] ?? '';
        $exclude = $payload['exclude'] ?? '';
        $data = json_encode($payload['data'] ?? []);

        foreach ($this->localChannels[$channel] ?? [] as $socketId => $conn) {
            if ($socketId !== $exclude) {
                $conn->send($data);
            }
        }
    }

    public function onClose(TcpConnection $connection): void
    {
        $socketId = $connection->socketId ?? '';
        foreach ($connection->subscribedChannels ?? [] as $channel) {
            unset($this->localChannels[$channel][$socketId]);
            if (empty($this->localChannels[$channel])) {
                unset($this->localChannels[$channel]);
            }
        }
    }
}
```

## 频道类型与认证

| 频道前缀 | 认证要求 | 说明 |
|----------|---------|------|
| 无前缀 | 无 | 公共频道，任何连接可订阅 |
| `private-` | HMAC-SHA256 签名 | 私有频道，服务端验证签名 |
| `presence-` | HMAC-SHA256 + user_data | Presence 频道，附带用户信息 |

私有频道签名验证示例：

```php
<?php

declare(strict_types=1);

function verifyChannelAuth(string $socketId, string $channel, string $auth, string $appKey, string $appSecret): bool
{
    $expected = $appKey . ':' . hash_hmac('sha256', $socketId . ':' . $channel, $appSecret);
    return hash_equals($expected, $auth);
}
```

## 检测

**代码审查清单**

- [ ] 多 Worker（`count > 1`）时是否通过 Redis pub/sub 做跨进程广播？
- [ ] `private-` 频道是否验证 HMAC 签名？
- [ ] `presence-` 频道是否持久化在线用户列表？
- [ ] `onClose` 是否清理了所有频道订阅？
- [ ] 频道为空时是否从 map 中移除？

## 相关规则

- [websocket-server-setup](./websocket-server-setup.md) — 多 Worker 进程配置
- [connection-lifecycle](./connection-lifecycle.md) — 连接关闭时的清理
