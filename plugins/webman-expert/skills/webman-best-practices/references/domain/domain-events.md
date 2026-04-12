# 领域事件

## 影响程度
**中等** - 缺少领域事件会导致紧耦合，副作用放错位置。

## 问题
未使用领域事件传达状态变更，导致副作用直接在 Service 或实体中处理。

## 为什么重要
- **解耦**：将核心逻辑与副作用分离
- **可扩展性**：易于添加对事件的新响应
- **审计追踪**：事件提供发生了什么的历史记录
- **DDD 原则**：事件捕获重要的业务时刻

## ❌ 错误示例

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\contract\gateway\EmailGatewayInterface;
use app\contract\repository\UserRepositoryInterface;

final class CreateOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly EmailGatewayInterface $emailGateway,
        private readonly UserRepositoryInterface $userRepository
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        $order = Order::create($userId, $items);
        $this->orderRepository->save($order);

        // ❌ 副作用直接在 Service 中
        $user = $this->userRepository->findById($userId);
        $this->emailGateway->send($user->email(), 'Order Created', '...');

        // ❌ 更多副作用
        $user->incrementOrderCount();
        $this->userRepository->save($user);

        return $order;
    }
}
```

## ✅ 正确示例

```php
<?php

declare(strict_types=1);

namespace app\domain\order\event;

use app\domain\order\entity\Order;

final class OrderCreated
{
    public function __construct(
        private readonly Order $order,
        private readonly \DateTimeImmutable $occurredAt = new \DateTimeImmutable()
    ) {
    }

    public function order(): Order
    {
        return $this->order;
    }

    public function userId(): int
    {
        return $this->order->userId();
    }

    public function occurredAt(): \DateTimeImmutable
    {
        return $this->occurredAt;
    }
}
```

**实体记录事件**：
```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

use app\domain\order\event\OrderCreated;
use app\domain\order\event\OrderPaid;

final class Order
{
    private array $domainEvents = [];

    public static function create(int $userId, array $items): self
    {
        $order = new self(
            id: 0,
            userId: $userId,
            items: $items,
            totalAmount: Money::zero(),
            status: OrderStatus::pending()
        );

        // ✅ 记录领域事件
        $order->recordEvent(new OrderCreated($order));

        return $order;
    }

    public function markAsPaid(): void
    {
        $this->status = OrderStatus::paid();

        // ✅ 记录领域事件
        $order->recordEvent(new OrderPaid($this));
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

**Service 分发事件**：
```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\contract\event\EventDispatcherInterface;

final class CreateOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly EventDispatcherInterface $eventDispatcher
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        $order = Order::create($userId, $items);
        $this->orderRepository->save($order);

        // ✅ 分发事件
        foreach ($order->releaseEvents() as $event) {
            $this->eventDispatcher->dispatch($event);
        }

        return $order;
    }
}
```

**事件监听器处理副作用**：
```php
<?php

declare(strict_types=1);

namespace app\listener;

use app\domain\order\event\OrderCreated;
use app\contract\gateway\EmailGatewayInterface;
use app\contract\repository\UserRepositoryInterface;

final class SendOrderConfirmationEmail
{
    public function __construct(
        private readonly EmailGatewayInterface $emailGateway,
        private readonly UserRepositoryInterface $userRepository
    ) {
    }

    public function handle(OrderCreated $event): void
    {
        $user = $this->userRepository->findById($event->userId());

        $this->emailGateway->send(
            to: $user->email(),
            subject: 'Order Confirmation',
            body: "Your order #{$event->order()->orderNumber()} has been created."
        );
    }
}
```

```php
<?php

declare(strict_types=1);

namespace app\listener;

use app\domain\order\event\OrderCreated;
use app\contract\repository\UserRepositoryInterface;

final class UpdateUserStatistics
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository
    ) {
    }

    public function handle(OrderCreated $event): void
    {
        $user = $this->userRepository->findById($event->userId());
        $user->incrementOrderCount();
        $this->userRepository->save($user);
    }
}
```

## 检测

**代码审查清单**：
- [ ] 实体在状态变更时记录领域事件？
- [ ] Service 层在持久化后分发事件？
- [ ] 副作用在事件监听器中处理？
- [ ] 事件是不可变的值对象？

## 相关规则
- [business-logic-in-domain](business-logic-in-domain.md)
- [service-circular-dependency](../architecture/service-circular-dependency.md)
