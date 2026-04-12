# Readonly 属性

## 影响程度
**中等** - 可变属性可能导致意外的状态变更和 bug。

## 问题
构造后不应更改的属性未使用 `readonly` 关键字，允许意外修改。

## 为什么重要
- **不可变性**：属性在构造后不可更改
- **线程安全**：readonly 属性不存在竞态条件
- **可预测性**：对象状态稳定
- **意图清晰**：readonly 向读者表明不可变性

## ❌ 错误示例

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;

final class CreateOrderService
{
    // ❌ 可以被重新赋值
    private OrderRepositoryInterface $orderRepository;

    public function __construct(OrderRepositoryInterface $orderRepository)
    {
        $this->orderRepository = $orderRepository;
    }

    public function handle(int $userId, array $items): Order
    {
        // ❌ 可能被意外重新赋值
        $this->orderRepository = new SomeOtherRepository();
        return $this->orderRepository->create($userId, $items);
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
    // ✅ 构造后不可重新赋值
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        // $this->orderRepository = new SomeOtherRepository(); // 编译错误！
        $order = Order::create($userId, $items);
        $this->orderRepository->save($order);
        return $order;
    }
}
```

## 何时使用 Readonly

### ✅ 适用场景

**依赖（始终使用）**：
```php
public function __construct(
    private readonly OrderRepositoryInterface $orderRepository,
    private readonly PaymentGatewayInterface $paymentGateway
) {
}
```

**不可变标识符**：
```php
private function __construct(
    private readonly int $id,
    private readonly string $uuid,
    private readonly \DateTimeImmutable $createdAt
) {
}
```

**值对象（所有属性）**：
```php
final class Money
{
    private function __construct(
        private readonly int $cents
    ) {
    }
}
```

### ❌ 不适用场景

**可变状态**：
```php
private function __construct(
    private readonly int $id,
    private OrderStatus $status,        // 可以变更
    private Money $totalAmount          // 可以变更
) {
}
```

**构造后设置的属性**：
```php
private ?string $resetToken = null;  // 后续设置，非 readonly
```

## 检测

**代码审查清单**：
- [ ] 所有注入的依赖都是 `readonly`？
- [ ] 所有不可变属性（id、createdAt）都是 `readonly`？
- [ ] 值对象的属性全部是 `readonly`？
- [ ] 仅可变状态省略 `readonly`？

**PHPStan 规则**：
```neon
# phpstan.neon
parameters:
    rules:
        - PHPStan\Rules\Properties\ReadOnlyPropertyRule
```

## 迁移

```php
// 修改前
private OrderRepositoryInterface $orderRepository;
public function __construct(OrderRepositoryInterface $orderRepository)
{
    $this->orderRepository = $orderRepository;
}

// 修改后：readonly + 属性提升
public function __construct(
    private readonly OrderRepositoryInterface $orderRepository
) {
}
```

## 相关规则
- [prefer-final-classes](prefer-final-classes.md) - 默认使用 final
- [constructor-property-promotion](constructor-property-promotion.md) - 配合属性提升使用
- [value-object-immutability](../domain/value-object-immutability.md) - 不可变值对象
