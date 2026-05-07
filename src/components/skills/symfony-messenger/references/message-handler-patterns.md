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
