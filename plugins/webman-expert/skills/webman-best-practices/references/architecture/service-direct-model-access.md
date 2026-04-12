# Service 直接访问 Model

## 影响程度

**高** - Service 直接使用 Model 绕过了 Repository 模式，违反了架构原则。

## 问题

Service 层直接使用 Eloquent Model 或数据库查询，而非通过 Repository 接口。

## 为什么重要

- **紧耦合**：Service 与 ORM 实现紧密耦合
- **不可测试**：无法脱离数据库进行测试
- **违反架构**：绕过了 Repository 抽象层
- **难以变更**：无法切换数据源

## ❌ 错误示例

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\model\eloquent\Order as OrderModel;
use support\Db;

final class GetOrderService
{
    public function handle(int $orderId): array
    {
        // ❌ 直接访问 Model
        $order = OrderModel::find($orderId);

        if (!$order) {
            throw new \RuntimeException('Order not found');
        }

        // ❌ 直接使用查询构建器
        $items = Db::table('order_items')
            ->where('order_id', $orderId)
            ->get();

        return [
            'order' => $order->toArray(),
            'items' => $items,
        ];
    }
}
```

## ✅ 正确示例

**Service 使用 Repository**：

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;

final class GetOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    public function handle(int $orderId): Order
    {
        // ✅ 使用 Repository
        $order = $this->orderRepository->findById($orderId);

        if ($order === null) {
            throw new \RuntimeException('Order not found');
        }

        return $order;
    }
}
```

**Repository 负责数据访问**：

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\eloquent;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;
use app\model\eloquent\Order as OrderModel;

final class EloquentOrderRepository implements OrderRepositoryInterface
{
    public function findById(int $id): ?Order
    {
        // ✅ Model 访问在基础设施层
        $model = OrderModel::with('items')->find($id);

        if ($model === null) {
            return null;
        }

        return $this->toDomain($model);
    }

    private function toDomain(OrderModel $model): Order
    {
        return Order::reconstitute(
            id: $model->id,
            userId: $model->user_id,
            items: $model->items->toArray(),
            totalAmount: Money::fromDollars($model->total_amount),
            status: OrderStatus::from($model->status)
        );
    }
}
```

## 检测

**代码审查清单**：

- [ ] Service 是否引入了任何 Model 类？
- [ ] Service 是否使用了 `Db::` 门面？
- [ ] Service 是否调用了 `Model::find()`、`Model::where()` 等方法？
- [ ] 所有数据访问是否都通过 Repository？

**PHPStan 规则**（自定义）：

```php
// 检测 Service 中的 Model 使用
if (class in app\service && uses app\model) {
    report("Service should not directly depend on Model");
}
```

## 相关规则

- [controller-skip-service](controller-skip-service.md)
- [infrastructure-without-contract](infrastructure-without-contract.md)
