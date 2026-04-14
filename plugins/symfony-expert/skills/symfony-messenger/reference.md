# Symfony Messenger 参考

本文件补充 `symfony-messenger` 的配置、消费和失败恢复细节。

## 最小可用配置

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

## Handler 示例

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

## 运行与排障命令

- `php bin/console messenger:consume async --time-limit=60 --memory-limit=256M`
- `php bin/console messenger:failed:show`
- `php bin/console messenger:failed:retry --force`
- `./vendor/bin/phpunit --filter=Messenger`

## 需要重点验证的失败模式

- 同一消息重复投递后，Handler 产生重复副作用。
- 路由写错，消息落到了同步通道或错误 transport。
- 重试次数用尽后，没有进入 failure transport。
- 消费者内存持续上涨，说明 Handler 或底层写库缺少清理策略。
