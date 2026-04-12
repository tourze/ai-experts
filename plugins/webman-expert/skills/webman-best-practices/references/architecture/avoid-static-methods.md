# 避免静态方法

## 影响程度
**高** - 静态方法导致代码难以测试，且违反依赖注入原则。

## 问题
业务逻辑或依赖使用静态方法而非依赖注入的实例方法。

## 为什么重要
- **不可测试**：无法 mock 静态方法
- **隐式依赖**：静态调用创建了隐藏的耦合
- **违反 DIP**：依赖具体实现
- **难以扩展**：无法重写静态方法

## ❌ 错误示例

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\model\eloquent\Order as OrderModel;
use app\helper\EmailHelper;

final class CreateOrderService
{
    public function handle(int $userId, array $items): void
    {
        // ❌ 静态方法调用 - 隐式依赖
        $user = UserHelper::findById($userId);

        $order = new OrderModel();
        $order->user_id = $userId;
        $order->save();

        // ❌ 静态方法调用 - 无法 mock
        EmailHelper::send($user->email, 'Order Created', '...');
    }
}
```

```php
<?php

declare(strict_types=1);

namespace app\helper;

final class EmailHelper
{
    // ❌ 静态方法 - 难以测试
    public static function send(string $to, string $subject, string $body): void
    {
        // 直接发送邮件
        mail($to, $subject, $body);
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
use app\contract\gateway\EmailGatewayInterface;
use app\domain\order\entity\Order;

final class CreateOrderService
{
    // ✅ 依赖注入
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository,
        private readonly UserRepositoryInterface $userRepository,
        private readonly EmailGatewayInterface $emailGateway
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        // ✅ 实例方法 - 可以 mock
        $user = $this->userRepository->findById($userId);

        $order = Order::create($userId, $items);
        $this->orderRepository->save($order);

        // ✅ 实例方法 - 可以 mock
        $this->emailGateway->send($user->email(), 'Order Created', '...');

        return $order;
    }
}
```

```php
<?php

declare(strict_types=1);

namespace app\infrastructure\gateway\email;

use app\contract\gateway\EmailGatewayInterface;

final class SmtpEmailGateway implements EmailGatewayInterface
{
    // ✅ 实例方法 - 可测试
    public function send(string $to, string $subject, string $body): void
    {
        // SMTP 实现
    }
}
```

## 何时可以使用静态方法

### ✅ 命名构造函数
```php
<?php

final class Money
{
    private function __construct(
        private readonly int $cents
    ) {
    }

    // ✅ 静态工厂方法
    public static function fromCents(int $cents): self
    {
        return new self($cents);
    }

    // ✅ 静态工厂方法
    public static function fromDollars(float $dollars): self
    {
        return new self((int) round($dollars * 100));
    }
}
```

### ✅ 纯函数
```php
<?php

final class StringHelper
{
    // ✅ 纯函数 - 无依赖，无状态
    public static function slugify(string $text): string
    {
        return strtolower(preg_replace('/[^a-z0-9]+/i', '-', $text));
    }
}
```

### ✅ 值对象操作
```php
<?php

final class Uuid
{
    // ✅ 值对象的静态工厂
    public static function generate(): self
    {
        return new self(uuid_create());
    }
}
```

## 测试对比

### ❌ 静态方法（难以测试）
```php
<?php

// 无法 mock 静态方法
test('creates order', function () {
    // ❌ 无法控制 UserHelper::findById 的返回值
    // ❌ 无法验证 EmailHelper::send 是否被调用
    $service = new CreateOrderService();
    $service->handle(1, []);
});
```

### ✅ 依赖注入（易于测试）
```php
<?php

test('creates order', function () {
    // ✅ 可以 mock 依赖
    $mockUserRepo = Mockery::mock(UserRepositoryInterface::class);
    $mockOrderRepo = Mockery::mock(OrderRepositoryInterface::class);
    $mockEmailGateway = Mockery::mock(EmailGatewayInterface::class);

    $mockUserRepo->shouldReceive('findById')->once()->andReturn($user);
    $mockOrderRepo->shouldReceive('save')->once();
    $mockEmailGateway->shouldReceive('send')->once();

    $service = new CreateOrderService($mockUserRepo, $mockOrderRepo, $mockEmailGateway);
    $order = $service->handle(1, []);

    expect($order)->toBeInstanceOf(Order::class);
});
```

## 检测

**代码审查清单**：
- [ ] Service 使用依赖注入而非静态调用？
- [ ] 静态方法仅用于工厂和纯函数？
- [ ] 没有带副作用的静态方法？

**PHPStan 规则**：
```neon
# phpstan.neon
parameters:
    rules:
        - PHPStan\Rules\Methods\StaticMethodCallRule
```

## 相关规则
- [constructor-injection](constructor-injection.md)
- [no-service-locator](no-service-locator.md)
