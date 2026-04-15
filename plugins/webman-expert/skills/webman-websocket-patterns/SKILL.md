---
name: webman-websocket-patterns
description: Webman WebSocket 开发。覆盖服务端搭建、连接生命周期、心跳、频道广播与客户端重连。
license: MIT
metadata:
  author: webman-design
  version: "1.0.0"
---

Workerman WebSocket 在 webman 自定义进程中的使用模式。

## 适用场景

- 搭建 WebSocket 服务端或客户端。
- 管理连接生命周期、心跳、频道广播。

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

- `onClose` 不清理 → 写已关闭 socket。见 [connection-lifecycle](references/connection-lifecycle.md)。
- 多 Worker 只用内存数组 → 跨进程丢消息。见 [channel-subscription](references/channel-subscription.md)。
- 断线立即重连 → 惊群效应。见 [reconnect-strategy](references/reconnect-strategy.md)。
- `onMessage` 同步写库 → 阻塞事件循环。
