# 构造函数注入

## 影响程度
**高** - 正确的依赖注入使代码可测试且易于维护。

## 问题
未通过构造函数注入依赖，而是使用属性注入、setter 注入或服务定位器模式。

## 为什么重要
- **依赖显式化**：所有依赖在构造函数中一目了然
- **不可变性**：依赖在构造后不可更改
- **可测试性**：测试中可轻松注入 mock
- **快速失败**：缺少依赖时立即报错

## ❌ 错误示例

### 属性注入
```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;

final class CreateOrderService
{
    // ❌ 公共属性注入
    public OrderRepositoryInterface $orderRepository;

    public function handle(int $userId, array $items): Order
    {
        // 如果未设置，可能为 null！
        return $this->orderRepository->create($userId, $items);
    }
}
```

### Setter 注入
```php
<?php

declare(strict_types=1);

namespace app\service\order;

final class CreateOrderService
{
    private ?OrderRepositoryInterface $orderRepository = null;

    // ❌ Setter 注入
    public function setOrderRepository(OrderRepositoryInterface $repository): void
    {
        $this->orderRepository = $repository;
    }

    public function handle(int $userId, array $items): Order
    {
        // 如果未调用 setter，可能为 null！
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
use app\contract\repository\UserRepositoryInterface;
use app\contract\gateway\PaymentGatewayInterface;
use app\domain\order\entity\Order;
use support\Db;

final class CreateOrderService
{
    // ✅ 通过构造函数注入 + readonly
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly UserRepositoryInterface $userRepository,
        private readonly PaymentGatewayInterface $paymentGateway
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        return Db::transaction(function () use ($userId, $items) {
            // ✅ 依赖保证存在
            $user = $this->userRepository->findById($userId);
            $order = Order::create($user->id(), $items);
            $this->orderRepository->save($order);
            $this->paymentGateway->createPaymentIntent($order);
            return $order;
        });
    }
}
```

## 优势

### 依赖显式化
```php
// ✅ 所有依赖一目了然
public function __construct(
    private readonly OrderRepositoryInterface $orderRepository,
    private readonly UserRepositoryInterface $userRepository,
    private readonly PaymentGatewayInterface $paymentGateway
) {
}
```

### 不可变性
```php
// ✅ 无法重新赋值依赖
$this->orderRepository = new SomeOtherRepository(); // 编译错误！
```

### 易于测试
```php
<?php

test('creates order', function () {
    // ✅ 轻松注入 mock
    $mockOrderRepo = Mockery::mock(OrderRepositoryInterface::class);
    $mockUserRepo = Mockery::mock(UserRepositoryInterface::class);
    $mockPaymentGateway = Mockery::mock(PaymentGatewayInterface::class);

    $service = new CreateOrderService(
        $mockOrderRepo,
        $mockUserRepo,
        $mockPaymentGateway
    );

    // 测试...
});
```

## 检测

**代码审查清单**：
- [ ] 所有依赖都通过构造函数注入？
- [ ] 没有用于依赖的公共属性？
- [ ] 没有用于依赖的 setter 方法？
- [ ] 构造函数参数使用了 readonly？

## 相关规则
- [avoid-static-methods](avoid-static-methods.md)
- [no-service-locator](no-service-locator.md)
- [readonly-properties](../code-style/readonly-properties.md)
