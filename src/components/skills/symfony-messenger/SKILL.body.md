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
