# 构造函数属性提升

## 影响程度
**低** - 减少样板代码，但不影响功能。

## 问题
未使用 PHP 8.0+ 构造函数属性提升特性，导致构造函数代码冗长。

## 为什么重要
- **减少样板**：消除代码重复
- **更简洁**：更易读和维护
- **现代 PHP**：使用 PHP 8.0+ 特性
- **配合良好**：与 `readonly` 完美搭配

## ❌ 错误示例

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;

final class CreateOrderService
{
    // ❌ 冗长：属性声明 + 赋值
    private readonly OrderRepositoryInterface $orderRepository;

    public function __construct(OrderRepositoryInterface $orderRepository)
    {
        $this->orderRepository = $orderRepository;
    }
}
```

## ✅ 正确示例

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;

final class CreateOrderService
{
    // ✅ 简洁：声明 + 赋值合为一行
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        $order = Order::create($userId, $items);
        $this->orderRepository->save($order);
        return $order;
    }
}
```

## 语法

### 基本提升
```php
// PHP 8.0 之前
private OrderRepositoryInterface $repository;

public function __construct(OrderRepositoryInterface $repository)
{
    $this->repository = $repository;
}

// PHP 8.0+
public function __construct(
    private OrderRepositoryInterface $repository
) {
}
```

### 配合 Readonly
```php
// ✅ 提升 + readonly
public function __construct(
    private readonly OrderRepositoryInterface $orderRepository,
    private readonly UserRepositoryInterface $userRepository
) {
}
```

### 带默认值
```php
public function __construct(
    private readonly string $name,
    private readonly int $maxRetries = 3,
    private readonly bool $enabled = true
) {
}
```

### 混合提升与非提升
```php
public function __construct(
    private readonly OrderRepositoryInterface $orderRepository,  // 提升
    array $config                                                // 未提升
) {
    $this->validateConfig($config);  // 需要赋值前处理
}
```

## 完整示例

### 多依赖的 Service
```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\contract\repository\UserRepositoryInterface;
use app\contract\gateway\PaymentGatewayInterface;
use app\contract\event\EventDispatcherInterface;
use app\domain\order\entity\Order;
use support\Db;

final class CreateOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly UserRepositoryInterface $userRepository,
        private readonly PaymentGatewayInterface $paymentGateway,
        private readonly EventDispatcherInterface $eventDispatcher
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        return Db::transaction(function () use ($userId, $items) {
            $user = $this->userRepository->findById($userId);
            $order = Order::create($user->id(), $items);
            $this->orderRepository->save($order);
            $this->paymentGateway->createPaymentIntent($order);

            foreach ($order->releaseEvents() as $event) {
                $this->eventDispatcher->dispatch($event);
            }

            return $order;
        });
    }
}
```

### 领域实体（私有构造函数）
```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

use app\domain\order\value_object\Money;
use app\domain\order\value_object\OrderStatus;

final class Order
{
    private array $domainEvents = [];

    // ✅ 私有构造函数中的属性提升
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
        $order = new self(
            id: 0,
            userId: $userId,
            items: $items,
            totalAmount: Money::zero(),
            status: OrderStatus::pending(),
            createdAt: new \DateTimeImmutable()
        );

        $order->calculateTotal();
        return $order;
    }
}
```

### 值对象
```php
<?php

declare(strict_types=1);

namespace app\domain\order\value_object;

final class Address
{
    // ✅ 所有属性提升且 readonly
    private function __construct(
        private readonly string $street,
        private readonly string $city,
        private readonly string $state,
        private readonly string $zipCode,
        private readonly string $country
    ) {
        $this->validate();
    }

    public static function create(
        string $street,
        string $city,
        string $state,
        string $zipCode,
        string $country
    ): self {
        return new self($street, $city, $state, $zipCode, $country);
    }

    private function validate(): void
    {
        if (empty($this->street)) {
            throw new \InvalidArgumentException('Street cannot be empty');
        }
    }

    public function street(): string
    {
        return $this->street;
    }
}
```

## 何时不使用属性提升

### 赋值前需要校验
```php
public function __construct(
    string $email  // 未提升
) {
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        throw new \InvalidArgumentException('Invalid email');
    }
    $this->email = $email;
}
```

### 需要转换
```php
public function __construct(
    string $password  // 未提升
) {
    $this->hashedPassword = password_hash($password, PASSWORD_BCRYPT);
}
```

## 检测

**代码审查清单**：
- [ ] 使用 PHP 8.0+？
- [ ] 构造函数参数尽可能使用属性提升？
- [ ] 配合 `readonly` 实现不可变属性？

## 相关规则
- [readonly-properties](readonly-properties.md) - 使用 readonly 实现不可变性
- [complete-type-declarations](complete-type-declarations.md) - 为所有参数添加类型
