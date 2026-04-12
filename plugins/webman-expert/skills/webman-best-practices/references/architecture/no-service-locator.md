# 禁止服务定位器

## 影响程度
**高** - 服务定位器模式隐藏依赖关系，导致代码难以测试。

## 问题
使用服务定位器或全局容器获取依赖，而非通过构造函数注入。

## 为什么重要
- **隐式依赖**：无法看出类依赖了什么
- **不可测试**：难以 mock 依赖
- **运行时错误**：缺少依赖仅在运行时才被发现
- **反模式**：违反依赖注入原则

## ❌ 错误示例

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use support\Container;

final class CreateOrderService
{
    public function handle(int $userId, array $items): Order
    {
        // ❌ 服务定位器 - 隐式依赖
        $orderRepository = Container::get(OrderRepositoryInterface::class);
        $userRepository = Container::get(UserRepositoryInterface::class);
        $paymentGateway = Container::get(PaymentGatewayInterface::class);

        $user = $userRepository->findById($userId);
        $order = Order::create($user->id(), $items);
        $orderRepository->save($order);
        $paymentGateway->createPaymentIntent($order);

        return $order;
    }
}
```

**问题所在**：依赖被隐藏了，无法从构造函数中看出。

## ✅ 正确示例

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\contract\repository\UserRepositoryInterface;
use app\contract\gateway\PaymentGatewayInterface;
use app\domain\order\entity\Order;

final class CreateOrderService
{
    // ✅ 依赖在构造函数中显式声明
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly UserRepositoryInterface $userRepository,
        private readonly PaymentGatewayInterface $paymentGateway
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        // ✅ 使用注入的依赖
        $user = $this->userRepository->findById($userId);
        $order = Order::create($user->id(), $items);
        $this->orderRepository->save($order);
        $this->paymentGateway->createPaymentIntent($order);
        return $order;
    }
}
```

## 容器使用方式

### ❌ 服务定位器（错误）
```php
<?php

// 在应用代码中
$service = Container::get(SomeService::class); // ❌ 反模式
```

### ✅ 依赖注入（正确）
```php
<?php

// 容器仅在组合根使用
// config/container.php
return [
    OrderRepositoryInterface::class => EloquentOrderRepository::class,
    UserRepositoryInterface::class => EloquentUserRepository::class,
];

// 应用代码使用构造函数注入
final class CreateOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }
}
```

## 检测

**代码审查清单**：
- [ ] 应用代码中没有 `Container::get()` 调用？
- [ ] 没有使用 `app()` 辅助函数获取依赖？
- [ ] 所有依赖都通过构造函数注入？
- [ ] 容器仅在组合根使用？

**Grep 命令**：
```bash
# 查找服务定位器的使用
grep -r "Container::get\|app()" app/service app/domain
```

## 相关规则
- [constructor-injection](constructor-injection.md)
- [avoid-static-methods](avoid-static-methods.md)
