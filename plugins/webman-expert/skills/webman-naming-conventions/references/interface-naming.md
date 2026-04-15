# 接口命名

## 影响程度
**中等** - 命名不一致导致代码难以理解，违反约定。

## 问题
接口缺少 `Interface` 后缀，导致无法区分接口和具体实现。

## 为什么重要
- **清晰性**：一眼就能知道是接口还是实现
- **约定**：PHP 社区接口命名标准
- **IDE 支持**：更好的自动补全和导航
- **避免混淆**：不会将接口误认为具体类

## ❌ 错误示例

```php
<?php

declare(strict_types=1);

namespace app\contract\repository;

use app\domain\order\entity\Order;

// ❌ 缺少 Interface 后缀
interface OrderRepository
{
    public function findById(int $id): ?Order;
    public function save(Order $order): void;
}
```

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\eloquent;

use app\contract\repository\OrderRepository;

// ❌ 容易混淆：这是接口还是实现？
final class EloquentOrderRepository implements OrderRepository
{
    // ...
}
```

## ✅ 正确示例

```php
<?php

declare(strict_types=1);

namespace app\contract\repository;

use app\domain\order\entity\Order;

// ✅ 清晰：这是一个接口
interface OrderRepositoryInterface
{
    public function findById(int $id): ?Order;

    public function findByUserId(int $userId): array;

    public function save(Order $order): void;

    public function delete(Order $order): void;
}
```

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\eloquent;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;
use app\model\eloquent\Order as OrderModel;

// ✅ 清晰：这是接口的实现
final class EloquentOrderRepository implements OrderRepositoryInterface
{
    public function findById(int $id): ?Order
    {
        $model = OrderModel::find($id);

        if ($model === null) {
            return null;
        }

        return $this->toDomain($model);
    }

    public function save(Order $order): void
    {
        $model = OrderModel::findOrNew($order->id());
        $model->user_id = $order->userId();
        $model->total_amount = $order->totalAmount()->toDollars();
        $model->status = $order->status()->value();
        $model->save();
    }

    private function toDomain(OrderModel $model): Order
    {
        // 从 Model 映射到领域实体
        return Order::reconstitute(
            id: $model->id,
            userId: $model->user_id,
            totalAmount: Money::fromDollars($model->total_amount),
            status: OrderStatus::from($model->status)
        );
    }
}
```

## 命名模式

### Repository 接口
```php
✅ OrderRepositoryInterface
✅ UserRepositoryInterface
✅ ProductRepositoryInterface

❌ OrderRepository
❌ IOrderRepository（匈牙利命名法）
❌ OrderRepo（缩写）
```

### Gateway 接口
```php
✅ PaymentGatewayInterface
✅ SmsGatewayInterface
✅ EmailGatewayInterface

❌ PaymentGateway
❌ IPaymentGateway
```

### Service 接口
```php
✅ NotificationServiceInterface
✅ CacheServiceInterface

❌ NotificationService
❌ INotificationService
```

## 检测

**代码审查清单**：
- [ ] `contract/` 中的所有接口都有 `Interface` 后缀？
- [ ] 没有接口使用 `I` 前缀（匈牙利命名法）？
- [ ] 接口名称具有描述性且清晰？

**PHPStan 规则**：
```neon
# phpstan.neon
parameters:
    rules:
        - PHPStan\Rules\Classes\InterfaceNamingRule
```

## 相关规则
- [repository-implementation-naming](repository-implementation-naming.md) - 实现的命名方式
- [service-naming-pattern](service-naming-pattern.md) - Service 命名规范
