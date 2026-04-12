# 优先使用 Final 类

## 影响程度
**中等** - 不需要继承的类不使用 final 会增加不必要的复杂性。

## 问题
未为非继承设计的类使用 `final` 关键字。这允许意外继承，使代码更难推理。

## 为什么重要
- **显式设计**：默认 final，仅在需要时才允许扩展
- **防止误用**：无法意外继承未为继承设计的类
- **性能**：PHP 可以更好地优化 final 类
- **更易重构**：可以修改内部实现而不破坏子类
- **PER 编码风格**：现代 PHP 标准推荐

## ❌ 错误示例

```php
<?php

declare(strict_types=1);

namespace app\service\order;

// ❌ 非 final，但并非为继承设计
class CreateOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        // ...
    }
}
```

**问题所在**：
```php
// 别人可能意外继承它
class ExtendedCreateOrderService extends CreateOrderService
{
    // 这不是原作者的意图
}
```

## ✅ 正确示例

```php
<?php

declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;

// ✅ 默认使用 final
final class CreateOrderService
{
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

## 何时不使用 Final

仅当类**明确为继承而设计**时才省略 `final`：

### 抽象类
```php
<?php

declare(strict_types=1);

namespace app\domain\shared;

// ✅ 抽象类不能是 final
abstract class AggregateRoot
{
    private array $domainEvents = [];

    protected function recordEvent(object $event): void
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

### 模板方法模式
```php
<?php

declare(strict_types=1);

namespace app\service\shared;

// ✅ 使用模板方法模式，专为继承设计
abstract class BaseImportService
{
    final public function import(string $filePath): void
    {
        $data = $this->readFile($filePath);
        $validated = $this->validate($data);
        $this->process($validated);
    }

    abstract protected function validate(array $data): array;
    abstract protected function process(array $data): void;

    private function readFile(string $filePath): array
    {
        // 通用实现
        return [];
    }
}
```

### 框架扩展点
```php
<?php

declare(strict_types=1);

namespace app\middleware;

use Webman\MiddlewareInterface;

// ✅ 中间件设计为可扩展
class BaseAuthMiddleware implements MiddlewareInterface
{
    public function process(Request $request, callable $handler): Response
    {
        if (!$this->isAuthenticated($request)) {
            return $this->unauthorized();
        }

        return $handler($request);
    }

    protected function isAuthenticated(Request $request): bool
    {
        // 可被子类重写
        return false;
    }

    protected function unauthorized(): Response
    {
        return json(['error' => 'Unauthorized'], 401);
    }
}
```

## 完整示例

### 领域实体（Final）
```php
<?php

declare(strict_types=1);

namespace app\domain\order\entity;

use app\domain\order\value_object\Money;
use app\domain\order\value_object\OrderStatus;

final class Order
{
    private function __construct(
        private readonly int $id,
        private readonly int $userId,
        private Money $totalAmount,
        private OrderStatus $status
    ) {
    }

    public static function create(int $userId, array $items): self
    {
        $order = new self(
            id: 0,
            userId: $userId,
            totalAmount: Money::zero(),
            status: OrderStatus::pending()
        );

        $order->calculateTotal($items);

        return $order;
    }

    private function calculateTotal(array $items): void
    {
        // 业务逻辑
    }
}
```

### 值对象（Final）
```php
<?php

declare(strict_types=1);

namespace app\domain\order\value_object;

final class Money
{
    private function __construct(
        private readonly int $cents
    ) {
    }

    public static function fromCents(int $cents): self
    {
        return new self($cents);
    }

    public function add(self $other): self
    {
        return new self($this->cents + $other->cents);
    }
}
```

### Repository 实现（Final）
```php
<?php

declare(strict_types=1);

namespace app\infrastructure\repository\eloquent;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;

final class EloquentOrderRepository implements OrderRepositoryInterface
{
    public function save(Order $order): void
    {
        // 实现
    }
}
```

## 检测

**代码审查清单**：
- [ ] 所有具体类都是 `final`？
- [ ] 仅抽象类和为继承设计的类省略 `final`？
- [ ] 没有 `final` 的类有关于继承的明确文档？

**PHPStan 规则**：
```neon
# phpstan.neon
parameters:
    rules:
        - PHPStan\Rules\Classes\RequireFinalClassRule
```

**Pint/PHP-CS-Fixer 规则**：
```php
// .php-cs-fixer.php
return (new PhpCsFixer\Config())
    ->setRules([
        'final_class' => true,
        'final_internal_class' => true,
    ]);
```

## 迁移指南

为现有类添加 `final`：

1. **识别候选类**：
```bash
# 查找非 final、非 abstract 的类
grep -r "^class " app/ | grep -v "abstract" | grep -v "final"
```

2. **添加 final 关键字**：
```php
// 修改前
class CreateOrderService

// 修改后
final class CreateOrderService
```

3. **运行测试**确保没有代码继承了这些类

4. 使用 **Rector** 自动化：
```php
// rector.php
use Rector\Config\RectorConfig;
use Rector\Php80\Rector\Class_\FinalPrivateToPrivateVisibilityRector;

return static function (RectorConfig $rectorConfig): void {
    $rectorConfig->rule(FinalPrivateToPrivateVisibilityRector::class);
};
```

## 相关规则
- [readonly-properties](readonly-properties.md) - 使用 readonly 实现不可变性
- [strict-types-declaration](strict-types-declaration.md) - 类型安全
