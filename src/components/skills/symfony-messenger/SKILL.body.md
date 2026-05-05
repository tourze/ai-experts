## 代码模式

```php
<?php

namespace App\Message;

final readonly class SyncInventoryMessage
{
    public function __construct(
        public int $productId,
        public string $requestId,
    ) {}
}
```

```php
<?php

namespace App\MessageHandler;

use App\Message\SyncInventoryMessage;
use Symfony\Component\Messenger\Attribute\AsMessageHandler;

#[AsMessageHandler(fromTransport: 'async')]
final class SyncInventoryMessageHandler
{
    public function __invoke(SyncInventoryMessage $message): void
    {
        if ($this->deduplicator->alreadyHandled($message->requestId)) {
            return;
        }

        $this->inventorySync->sync($message->productId);
        $this->deduplicator->markHandled($message->requestId);
    }
}
```

```yaml
# config/packages/messenger.yaml
framework:
  messenger:
    failure_transport: failed
    transports:
      async:
        dsn: '%env(MESSENGER_TRANSPORT_DSN)%'
        retry_strategy:
          max_retries: 5
          delay: 1000
          multiplier: 2
      failed: 'doctrine://default?queue_name=failed'
    routing:
      App\Message\SyncInventoryMessage: async
```

## 检查清单

- 消息是否只携带稳定、可序列化、可重试的数据，而不是整个实体对象。
- Handler 是否显式处理幂等、重试、超时和外部依赖失败。
- `messenger.yaml` 是否配置了路由、失败传输和合理的 retry strategy。
- 消费命令、失败队列查看与重放命令是否被纳入运维手册。
- 如果消息会触发写库或第三方回调，是否有 request id / 去重键 / outbox 等证据链。

## 反模式

### FAIL: Entity 塞进消息体

```php
final class SendOrderEmail {
    public function __construct(public Order $order) {} // 序列化时懒加载爆炸
}
```

### PASS: 只传 ID 和稳定字段

```php
final readonly class SendOrderEmail {
    public function __construct(public int $orderId, public string $requestId) {}
}
// Handler 里用 orderId 从 Repository 重新加载
```

### FAIL: Handler 无幂等保护

```php
public function __invoke(ChargeCustomer $msg): void {
    $this->stripe->charge($msg->amount); // 重试 = 重复扣款
    $this->emailService->send($msg->email);
}
```

### PASS: 去重键 + 幂等

```php
public function __invoke(ChargeCustomer $msg): void {
    if ($this->dedup->alreadyHandled($msg->requestId)) return;
    $this->stripe->charge($msg->amount, idempotency_key: $msg->requestId);
    $this->dedup->markHandled($msg->requestId);
}
```
