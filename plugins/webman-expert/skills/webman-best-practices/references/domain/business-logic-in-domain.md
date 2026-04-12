# 业务逻辑归属领域层

## 影响程度
**严重** - 业务逻辑放错层会导致代码不可测试且难以维护。

## 问题
业务逻辑放在 Service 层或 Controller 中，而非领域层，违反 DDD 原则。

## 为什么重要
- **可测试性**：领域逻辑应可脱离框架测试
- **可复用性**：业务规则可在不同 Service 中复用
- **清晰性**：业务规则显式且易发现
- **DDD 原则**：领域层包含业务逻辑

## ❌ 错误示例

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;

final class CancelOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    public function handle(int $orderId): void
    {
        $order = $this->orderRepository->findById($orderId);

        // ❌ 业务逻辑在 Service 层
        if ($order->status() === 'shipped' || $order->status() === 'delivered') {
            throw new \RuntimeException('Cannot cancel shipped or delivered orders');
        }

        if ($order->createdAt()->diff(new \DateTime())->days > 30) {
            throw new \RuntimeException('Cannot cancel orders older than 30 days');
        }

        $order->setStatus('cancelled');
        $this->orderRepository->save($order);
    }
}
```

## ✅ 正确示例

```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

use app\domain\order\value_object\OrderStatus;
use app\domain\order\exception\InvalidOrderOperationException;

final class Order
{
    private function __construct(
        private readonly int $id,
        private readonly int $userId,
        private OrderStatus $status,
        private readonly \DateTimeImmutable $createdAt
    ) {
    }

    // ✅ 业务逻辑在领域层
    public function cancel(): void
    {
        // 业务规则：不能取消已发货或已送达的订单
        if ($this->status->isShipped() || $this->status->isDelivered()) {
            throw new InvalidOrderOperationException(
                'Cannot cancel shipped or delivered orders'
            );
        }

        // 业务规则：不能取消超过 30 天的订单
        $daysSinceCreation = $this->createdAt->diff(new \DateTimeImmutable())->days;
        if ($daysSinceCreation > 30) {
            throw new InvalidOrderOperationException(
                'Cannot cancel orders older than 30 days'
            );
        }

        $this->status = OrderStatus::cancelled();
        $this->recordEvent(new OrderCancelled($this));
    }

    public function canBeCancelled(): bool
    {
        if ($this->status->isShipped() || $this->status->isDelivered()) {
            return false;
        }

        $daysSinceCreation = $this->createdAt->diff(new \DateTimeImmutable())->days;
        return $daysSinceCreation <= 30;
    }
}
```

**Service 层变得精简**：
```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;

final class CancelOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    public function handle(int $orderId): void
    {
        $order = $this->orderRepository->findById($orderId);

        // ✅ Service 仅做编排，领域层包含逻辑
        $order->cancel();

        $this->orderRepository->save($order);
    }
}
```

## 什么属于领域层

### ✅ 业务规则
- 校验逻辑
- 状态转换
- 计算
- 不变量
- 约束

### ✅ 业务行为
- 改变状态的实体方法
- 值对象操作
- 领域事件
- 聚合协调

### ❌ 不属于领域层
- 数据库查询
- HTTP 请求
- 文件 I/O
- 框架依赖
- 事务管理

## 检测

**代码审查清单**：
- [ ] 业务规则在领域实体/值对象中？
- [ ] Service 层仅做编排？
- [ ] 领域层无框架依赖？

## 相关规则
- [domain-framework-dependency](../architecture/domain-framework-dependency.md)
- [rich-domain-model](rich-domain-model.md)
