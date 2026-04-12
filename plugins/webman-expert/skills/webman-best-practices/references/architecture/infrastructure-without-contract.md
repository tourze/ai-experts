# 基础设施层缺少契约

## 影响程度
**高** - 基础设施实现缺少契约会导致代码紧耦合且难以测试。

## 问题
基础设施层（Repository、Gateway）未实现契约接口，导致 Service 直接耦合到具体实现。

## 为什么重要
- **可测试性**：无法在测试中 mock 依赖
- **灵活性**：无法切换实现
- **依赖倒置**：高层模块依赖了底层细节
- **DDD 原则**：基础设施层应实现领域契约

## ❌ 错误示例

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\eloquent;

use app\domain\order\entity\Order;
use app\model\eloquent\Order as OrderModel;

// ❌ 未实现接口
final class EloquentOrderRepository
{
    public function save(Order $order): void
    {
        $model = OrderModel::findOrNew($order->id());
        $model->user_id = $order->userId();
        $model->save();
    }
}
```

**Service 直接依赖具体实现**：
```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\infrastructure\repository\eloquent\EloquentOrderRepository;

final class CreateOrderService
{
    public function __construct(
        private readonly EloquentOrderRepository $orderRepository // ❌ 依赖具体类
    ) {
    }
}
```

## ✅ 正确示例

**定义契约接口**：
```php
<?php

declare(strict_types=1);

namespace app\contract\repository;

use app\domain\order\entity\Order;

interface OrderRepositoryInterface
{
    public function findById(int $id): ?Order;

    public function findByUserId(int $userId): array;

    public function save(Order $order): void;

    public function delete(Order $order): void;
}
```

**基础设施实现契约**：
```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\eloquent;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;
use app\domain\order\value_object\Money;
use app\domain\order\value_object\OrderStatus;
use app\model\eloquent\Order as OrderModel;

// ✅ 实现接口
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

    public function findByUserId(int $userId): array
    {
        $models = OrderModel::where('user_id', $userId)->get();

        return $models->map(fn ($model) => $this->toDomain($model))->all();
    }

    public function save(Order $order): void
    {
        $model = OrderModel::findOrNew($order->id());
        $model->user_id = $order->userId();
        $model->total_amount = $order->totalAmount()->toDollars();
        $model->status = $order->status()->value();
        $model->save();

        // 分发领域事件
        foreach ($order->releaseEvents() as $event) {
            event($event);
        }
    }

    public function delete(Order $order): void
    {
        OrderModel::destroy($order->id());
    }

    private function toDomain(OrderModel $model): Order
    {
        return Order::reconstitute(
            id: $model->id,
            userId: $model->user_id,
            totalAmount: Money::fromDollars($model->total_amount),
            status: OrderStatus::from($model->status),
            createdAt: new \DateTimeImmutable($model->created_at)
        );
    }
}
```

**Service 依赖接口**：
```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;

final class CreateOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository // ✅ 依赖接口
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

**配置依赖注入**：
```php
<?php

// config/container.php
use app\contract\repository\OrderRepositoryInterface;
use app\infrastructure\repository\eloquent\EloquentOrderRepository;

return [
    OrderRepositoryInterface::class => EloquentOrderRepository::class,
];
```

## 优势

### 可测试性
```php
<?php

// tests/Unit/Service/CreateOrderServiceTest.php
use app\contract\repository\OrderRepositoryInterface;
use app\service\order\CreateOrderService;

test('creates order', function () {
    // ✅ 可以 mock 接口
    $mockRepository = Mockery::mock(OrderRepositoryInterface::class);
    $mockRepository->shouldReceive('save')->once();

    $service = new CreateOrderService($mockRepository);
    $order = $service->handle(userId: 1, items: []);

    expect($order)->toBeInstanceOf(Order::class);
});
```

### 灵活性
```php
<?php

// 可以切换实现
class RedisOrderRepository implements OrderRepositoryInterface
{
    // 不同的实现
}

// config/container.php
return [
    OrderRepositoryInterface::class => RedisOrderRepository::class, // ✅ 轻松切换
];
```

## 检测

**代码审查清单**：
- [ ] 所有基础设施类都实现了契约接口？
- [ ] Service 依赖接口而非具体类？
- [ ] 容器配置了接口到实现的绑定？

## 相关规则
- [service-direct-model-access](service-direct-model-access.md)
- [constructor-injection](constructor-injection.md)
