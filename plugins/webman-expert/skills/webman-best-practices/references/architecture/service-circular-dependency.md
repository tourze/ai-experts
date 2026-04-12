# Service 循环依赖

## 影响程度
**高** - 循环依赖导致初始化问题，表明设计不良。

## 问题
两个或多个 Service 相互依赖，形成循环依赖，导致代码无法初始化且难以测试。

## 为什么重要
- **初始化失败**：无法实例化存在循环依赖的 Service
- **设计不良**：表明职责分离不清晰
- **测试噩梦**：无法正确 mock 依赖
- **紧耦合**：Service 之间耦合过于紧密

## ❌ 错误示例

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\service\user\UserService;

final class OrderService
{
    public function __construct(
        private readonly UserService $userService // ❌ 依赖 UserService
    ) {
    }

    public function createOrder(int $userId): void
    {
        $this->userService->validateUser($userId);
        // ...
    }
}
```

```php
<?php

declare(strict_types=1);

namespace app\service\user;

use app\service\order\OrderService;

final class UserService
{
    public function __construct(
        private readonly OrderService $orderService // ❌ 依赖 OrderService
    ) {
    }

    public function getUserOrders(int $userId): array
    {
        return $this->orderService->getOrdersByUser($userId);
    }
}
```

**问题所在**：两个 Service 都无法实例化，因为各自都需要对方。

## ✅ 正确示例

### 方案一：将共享逻辑提取到 Repository

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\UserRepositoryInterface;
use app\contract\repository\OrderRepositoryInterface;

final class CreateOrderService
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository,
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        // ✅ 使用 Repository 代替 UserService
        $user = $this->userRepository->findById($userId);

        if ($user === null) {
            throw new \RuntimeException('User not found');
        }

        $order = Order::create($user->id(), $items);
        $this->orderRepository->save($order);

        return $order;
    }
}
```

```php
<?php

declare(strict_types=1);

namespace app\service\user;

use app\contract\repository\OrderRepositoryInterface;

final class GetUserOrdersService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    public function handle(int $userId): array
    {
        // ✅ 使用 Repository 代替 OrderService
        return $this->orderRepository->findByUserId($userId);
    }
}
```

### 方案二：使用领域事件

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

        // ✅ 分发事件代替调用 UserService
        foreach ($order->releaseEvents() as $event) {
            $this->eventDispatcher->dispatch($event);
        }

        return $order;
    }
}
```

```php
<?php

declare(strict_types=1);

namespace app\listener;

use app\domain\order\event\OrderCreated;
use app\contract\repository\UserRepositoryInterface;

final class UpdateUserStatisticsListener
{
    public function __construct(
        private readonly UserRepositoryInterface $userRepository
    ) {
    }

    public function handle(OrderCreated $event): void
    {
        // ✅ 响应事件，无循环依赖
        $user = $this->userRepository->findById($event->userId());
        $user->incrementOrderCount();
        $this->userRepository->save($user);
    }
}
```

## 检测

**代码审查清单**：
- [ ] 绘制依赖图 - 是否存在环？
- [ ] 所有 Service 能否独立实例化？
- [ ] Service 是否依赖同层的其他 Service？

**PHPStan 规则**：
```neon
# phpstan.neon
parameters:
    rules:
        - PHPStan\Rules\Dependencies\CircularDependencyRule
```

## 相关规则
- [domain-events](../domain/domain-events.md) - 使用事件解耦
- [constructor-injection](constructor-injection.md) - 正确的依赖注入
