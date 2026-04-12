# 完整类型声明

## 影响程度
**高** - 缺少类型声明会让类型错误无法被捕获。

## 问题
参数、返回值或属性缺少类型声明，允许任意类型传入或返回。

## 为什么重要
- **类型安全**：在开发阶段捕获类型错误
- **IDE 支持**：更好的自动补全和重构
- **文档作用**：类型即内联文档
- **重构信心**：可以安全地修改代码
- **PER 编码风格**：现代标准要求

## ❌ 错误示例

```php
<?php

declare(strict_types=1);

namespace app\service\order;

final class CreateOrderService
{
    // ❌ 参数无类型
    public function __construct($orderRepository)
    {
        $this->orderRepository = $orderRepository;
    }

    // ❌ 参数和返回值均无类型
    public function handle($userId, $items)
    {
        $order = $this->orderRepository->create($userId, $items);
        return $order;
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
    // ✅ 完整类型声明
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    // ✅ 所有参数和返回值都声明了类型
    public function handle(int $userId, array $items): Order
    {
        $order = Order::create($userId, $items);
        $this->orderRepository->save($order);
        return $order;
    }
}
```

## 类型声明规则

### 参数
```php
// ✅ 标量类型
public function process(int $id, string $name, bool $active): void

// ✅ 类类型
public function handle(Order $order, User $user): void

// ✅ 接口类型
public function save(OrderRepositoryInterface $repository): void

// ✅ 数组类型
public function create(array $items): void

// ✅ 可空类型
public function find(?int $id): ?Order

// ✅ 联合类型（PHP 8.0+）
public function process(int|string $id): void

// ✅ Mixed 类型（确实需要时）
public function handle(mixed $data): void
```

### 返回值
```php
// ✅ 无返回值用 void
public function delete(int $id): void

// ✅ 标量返回
public function count(): int

// ✅ 对象返回
public function create(): Order

// ✅ 可空返回
public function find(int $id): ?Order

// ✅ 数组返回
public function list(): array

// ✅ Self 返回（链式调用）
public function withName(string $name): self

// ✅ Static 返回（工厂方法）
public static function create(): static
```

### 属性
```php
// ✅ 类型化属性（PHP 7.4+）
private int $id;
private string $name;
private ?Order $order = null;
private array $items = [];

// ✅ 配合 readonly（PHP 8.1+）
private readonly int $id;
private readonly OrderRepositoryInterface $repository;
```

## 完整示例

```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

use app\domain\order\value_object\Money;
use app\domain\order\value_object\OrderStatus;
use app\domain\order\value_object\OrderNumber;
use app\domain\order\event\OrderCreated;

final class Order
{
    private array $domainEvents = [];

    private function __construct(
        private readonly int $id,
        private readonly OrderNumber $orderNumber,
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
            orderNumber: OrderNumber::generate(),
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

    public function calculateTotal(): void
    {
        $total = array_reduce(
            $this->items,
            fn (Money $carry, array $item): Money => $carry->add(
                Money::fromCents($item['price'] * $item['quantity'])
            ),
            Money::zero()
        );

        $this->totalAmount = $total;
    }

    public function markAsPaid(): void
    {
        $this->status = OrderStatus::paid();
    }

    // 带返回值类型的访问器
    public function id(): int
    {
        return $this->id;
    }

    public function orderNumber(): OrderNumber
    {
        return $this->orderNumber;
    }

    public function totalAmount(): Money
    {
        return $this->totalAmount;
    }

    public function status(): OrderStatus
    {
        return $this->status;
    }

    public function items(): array
    {
        return $this->items;
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

## 检测

**代码审查清单**：
- [ ] 所有方法参数都有类型？
- [ ] 所有方法都有返回值类型？
- [ ] 所有属性都有类型（PHP 7.4+）？
- [ ] 除非确实必要，否则不使用 `mixed` 类型？

**PHPStan 规则**：
```neon
# phpstan.neon
parameters:
    level: 8  # 要求完整类型声明
```

## 相关规则
- [strict-types-declaration](strict-types-declaration.md) - 启用严格类型
- [readonly-properties](readonly-properties.md) - 使用 readonly 实现不可变性
