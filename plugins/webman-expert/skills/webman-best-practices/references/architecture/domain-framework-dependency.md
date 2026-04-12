# 领域层框架依赖

## 影响程度
**严重** - 破坏领域层的独立性，导致代码不可测试。

## 问题
领域层（实体、值对象、领域服务）依赖框架类，如 `Request`、`DB`、`Cache` 或 Webman 特有的工具类。这违反了 DDD 的核心原则：领域层应该是纯 PHP，不依赖任何框架。

## 为什么重要
- **不可测试**：无法脱离框架测试领域逻辑
- **框架锁定**：切换框架时必须重写领域层
- **违反 DDD**：领域层应表达业务规则，而非技术细节
- **难以理解**：业务逻辑与技术基础设施混杂
- **违反依赖倒置**：领域层依赖了底层细节

## ❌ 错误示例

```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

use support\Db; // ❌ 框架依赖
use support\Cache; // ❌ 框架依赖

final class Order
{
    private function __construct(
        private readonly int $id,
        private int $userId,
        private float $totalAmount,
        private string $status
    ) {
    }

    public static function create(int $userId, array $items): self
    {
        // ❌ 在领域层直接访问数据库
        $user = Db::table('users')->where('id', $userId)->first();

        if (!$user) {
            throw new \RuntimeException('User not found');
        }

        $total = array_sum(array_column($items, 'price'));

        // ❌ 在领域层直接访问缓存
        Cache::set("order_draft_{$userId}", $items, 3600);

        return new self(
            id: 0,
            userId: $userId,
            totalAmount: $total,
            status: 'pending'
        );
    }

    public function markAsPaid(): void
    {
        $this->status = 'paid';

        // ❌ 在领域层直接更新数据库
        Db::table('orders')
            ->where('id', $this->id)
            ->update(['status' => 'paid']);
    }
}
```

## ✅ 正确示例

```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

use app\domain\order\value_object\Money;
use app\domain\order\value_object\OrderStatus;
use app\domain\order\event\OrderCreated;
use app\domain\order\event\OrderPaid;
use app\domain\order\exception\InvalidOrderException;

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

    /**
     * 纯领域逻辑 - 无框架依赖
     */
    public static function create(int $userId, array $items): self
    {
        // 业务规则校验
        if (empty($items)) {
            throw new InvalidOrderException('Order must have at least one item');
        }

        $order = new self(
            id: 0,
            userId: $userId,
            items: $items,
            totalAmount: Money::zero(),
            status: OrderStatus::pending(),
            createdAt: new \DateTimeImmutable()
        );

        // 使用领域逻辑计算总额
        $order->calculateTotal();

        // 记录领域事件（此处不持久化）
        $order->recordEvent(new OrderCreated($order));

        return $order;
    }

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

    public function markAsPaid(): void
    {
        // 业务规则：仅待处理订单可被标记为已支付
        if (!$this->status->isPending()) {
            throw new InvalidOrderException('Only pending orders can be marked as paid');
        }

        $this->status = OrderStatus::paid();
        $this->recordEvent(new OrderPaid($this));
    }

    // 访问器
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

**基础设施层负责持久化**：

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\eloquent;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;
use app\model\eloquent\Order as OrderModel;
use support\Db;

final class EloquentOrderRepository implements OrderRepositoryInterface
{
    public function save(Order $order): void
    {
        // 基础设施层负责数据库操作
        Db::transaction(function () use ($order) {
            $model = OrderModel::findOrNew($order->id());
            $model->user_id = $order->userId();
            $model->total_amount = $order->totalAmount()->toDollars();
            $model->status = $order->status()->value();
            $model->save();

            // 分发领域事件
            foreach ($order->releaseEvents() as $event) {
                event($event);
            }
        });
    }
}
```

## 检测

**代码审查清单**：
- [ ] 领域实体是否引入了 `support\*` 类？
- [ ] 领域实体是否引入了 `Illuminate\*` 类？
- [ ] 领域实体是否调用了 `Db::`、`Cache::`、`Redis::`？
- [ ] 领域实体是否使用了 `Request` 或 `Response`？
- [ ] 领域实体是否可以脱离框架实例化？

**领域层禁止引入**：
```php
use support\*;           // ❌ Webman 框架
use Illuminate\*;        // ❌ Laravel 组件
use Webman\*;            // ❌ Webman 核心
use think\*;             // ❌ ThinkPHP
```

**领域层允许引入**：
```php
use app\domain\*;        // ✅ 其他领域类
\DateTimeImmutable;      // ✅ PHP 标准库
\RuntimeException;       // ✅ PHP 标准库
```

## 相关规则
- [business-logic-in-domain](../domain/business-logic-in-domain.md) - 业务逻辑应放在哪里
- [infrastructure-without-contract](infrastructure-without-contract.md) - 基础设施层如何实现契约
