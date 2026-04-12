# 充血领域模型

## 影响程度
**高** - 贫血领域模型导致代码本质上是伪装成 OOP 的过程式代码。

## 问题
领域实体仅有 getter/setter 而没有任何行为，导致所有业务逻辑都在 Service 中。

## 为什么重要
- **OOP 原则**：对象应同时拥有数据和行为
- **封装性**：业务规则在实体内部受到保护
- **可维护性**：逻辑在它该在的地方
- **DDD 原则**：充血领域模型表达业务概念

## ❌ 错误示例（贫血模型）

```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

// ❌ 贫血：仅有 getter/setter，无行为
final class Order
{
    private int $id;
    private int $userId;
    private float $totalAmount;
    private string $status;

    public function getId(): int
    {
        return $this->id;
    }

    public function setId(int $id): void
    {
        $this->id = $id;
    }

    public function getUserId(): int
    {
        return $this->userId;
    }

    public function setUserId(int $userId): void
    {
        $this->userId = $userId;
    }

    public function getTotalAmount(): float
    {
        return $this->totalAmount;
    }

    public function setTotalAmount(float $totalAmount): void
    {
        $this->totalAmount = $totalAmount;
    }

    public function getStatus(): string
    {
        return $this->status;
    }

    public function setStatus(string $status): void
    {
        $this->status = $status;
    }
}
```

**业务逻辑最终落在 Service 中**：
```php
<?php

// ❌ Service 包含所有业务逻辑
final class OrderService
{
    public function cancel(Order $order): void
    {
        // 业务逻辑在实体外部
        if ($order->getStatus() === 'shipped') {
            throw new \RuntimeException('Cannot cancel shipped order');
        }

        $order->setStatus('cancelled');
    }

    public function calculateTotal(Order $order, array $items): void
    {
        // 业务逻辑在实体外部
        $total = 0;
        foreach ($items as $item) {
            $total += $item['price'] * $item['quantity'];
        }
        $order->setTotalAmount($total);
    }
}
```

## ✅ 正确示例（充血模型）

```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

use app\domain\order\value_object\Money;
use app\domain\order\value_object\OrderStatus;
use app\domain\order\exception\InvalidOrderOperationException;

// ✅ 充血：包含行为和业务规则
final class Order
{
    private array $domainEvents = [];

    private function __construct(
        private readonly int $id,
        private readonly int $userId,
        private array $items,
        private Money $totalAmount,
        private OrderStatus $status,
        private readonly \DateTimeImmutable $createdAt
    ) {
    }

    public static function create(int $userId, array $items): self
    {
        if (empty($items)) {
            throw new InvalidOrderOperationException('Order must have at least one item');
        }

        $order = new self(
            id: 0,
            userId: $userId,
            items: $items,
            totalAmount: Money::zero(),
            status: OrderStatus::pending(),
            createdAt: new \DateTimeImmutable()
        );

        $order->calculateTotal();
        $order->recordEvent(new OrderCreated($order));

        return $order;
    }

    // ✅ 业务行为：计算总额
    public function calculateTotal(): void
    {
        $total = array_reduce(
            $this->items,
            fn (Money $carry, array $item) => $carry->add(
                Money::fromCents($item['price'] * $item['quantity'])
            ),
            Money::zero()
        );

        $this->totalAmount = $total;
    }

    // ✅ 业务行为：带规则的取消
    public function cancel(): void
    {
        if (!$this->status->canBeCancelled()) {
            throw new InvalidOrderOperationException(
                'Order cannot be cancelled in current status'
            );
        }

        $daysSinceCreation = $this->createdAt->diff(new \DateTimeImmutable())->days;
        if ($daysSinceCreation > 30) {
            throw new InvalidOrderOperationException(
                'Cannot cancel orders older than 30 days'
            );
        }

        $this->status = OrderStatus::cancelled();
        $this->recordEvent(new OrderCancelled($this));
    }

    // ✅ 业务行为：标记为已支付
    public function markAsPaid(): void
    {
        if (!$this->status->isPending()) {
            throw new InvalidOrderOperationException(
                'Only pending orders can be marked as paid'
            );
        }

        $this->status = OrderStatus::paid();
        $this->recordEvent(new OrderPaid($this));
    }

    // ✅ 业务行为：添加商品
    public function addItem(array $item): void
    {
        if ($this->status->isShipped() || $this->status->isDelivered()) {
            throw new InvalidOrderOperationException(
                'Cannot add items to shipped or delivered orders'
            );
        }

        $this->items[] = $item;
        $this->calculateTotal();
    }

    // ✅ 业务查询：能否取消？
    public function canBeCancelled(): bool
    {
        if (!$this->status->canBeCancelled()) {
            return false;
        }

        $daysSinceCreation = $this->createdAt->diff(new \DateTimeImmutable())->days;
        return $daysSinceCreation <= 30;
    }

    // 访问器（无 setter！）
    public function id(): int
    {
        return $this->id;
    }

    public function userId(): int
    {
        return $this->userId;
    }

    public function totalAmount(): Money
    {
        return $this->totalAmount;
    }

    public function status(): OrderStatus
    {
        return $this->status;
    }

    private function recordEvent(object $event): void
    {
        $this->domainEvents[] = $event;
    }

    public function releaseEvents(): array
    {
        $events = $this->domainEvents;
        $this->domainEvents = [];
        return $events;
    }
}
```

**Service 变得精简**：
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

        // ✅ Service 仅做编排，实体包含行为
        $order->cancel();

        $this->orderRepository->save($order);
    }
}
```

## 充血 vs 贫血

### 贫血模型特征
- ❌ 仅有 getter/setter
- ❌ 所有属性都有公共 setter
- ❌ 无业务方法
- ❌ 所有逻辑在 Service 中
- ❌ 实体只是数据袋

### 充血模型特征
- ✅ 拥有业务方法（cancel、markAsPaid 等）
- ✅ 无公共 setter
- ✅ 实体内部包含校验
- ✅ 状态转换受控
- ✅ 实体保护不变量

## 检测

**代码审查清单**：
- [ ] 实体有 getter 之外的业务方法？
- [ ] 实体校验自身状态？
- [ ] 实体没有公共 setter？
- [ ] Service 是精简的编排者？

## 相关规则
- [business-logic-in-domain](business-logic-in-domain.md)
- [entity-identity](entity-identity.md)
- [value-object-immutability](value-object-immutability.md)
