Workerman WebSocket 在 webman 自定义进程中的使用模式。

## 核心约束

- 声明 `listen => 'websocket://...'`，设 `reloadable => false`。见 [websocket-server-setup](references/websocket-server-setup.md)。
- `onConnect` 分配 ID，`onWebSocketConnect` 认证，失败用 `pauseRecv()`。见 [connection-lifecycle](references/connection-lifecycle.md)。
- 跨进程广播走 Redis pub/sub。见 [channel-subscription](references/channel-subscription.md)。
- 客户端重连：指数退避 + 抖动 + 最大重试。见 [reconnect-strategy](references/reconnect-strategy.md)。

## 代码模式

```php
<?php
// config/process.php
return ['ws' => ['handler' => App\Ws\Server::class, 'listen' => 'websocket://0.0.0.0:8001', 'reloadable' => false]];
```

## 检查清单

- [ ] `reloadable => false` 且 `reusePort => true`
- [ ] `onClose` 清理频道订阅和定时器
- [ ] 私有频道要求签名验证
- [ ] 心跳容许偶尔丢包
- [ ] 多 Worker 通过 Redis pub/sub 广播

## 反模式

### FAIL: 多 Worker 仅用内存数组

```php
class Server {
    private static array $channels = []; // Worker 1 的订阅 Worker 2 看不到
    public function broadcast($channel, $msg) {
        foreach (self::$channels[$channel] ?? [] as $conn) $conn->send($msg);
    }
}
```

### PASS: Redis pub/sub 跨进程

```php
// 订阅
Redis::subscribe(["chan:$name"], fn($m) => $this->localBroadcast($name, $m));
// 发布
Redis::publish("chan:$name", $msg); // 所有 Worker 收到后本地广播
```

### FAIL: 断线立即重连

```javascript
ws.onclose = () => new WebSocket(url); // 服务端抖动时所有客户端同时重连，压垮服务
```

### PASS: 指数退避 + 抖动

```javascript
let attempt = 0;
ws.onclose = () => {
  const delay = Math.min(1000 * 2 ** attempt, 30000) + Math.random() * 1000;
  setTimeout(() => { new WebSocket(url); attempt++; }, delay);
};
```
