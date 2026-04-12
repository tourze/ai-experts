# 严格类型声明

## 影响程度
**高** - 缺少严格类型可能导致隐蔽的 bug 和类型强制转换问题。

## 问题
PHP 文件顶部未声明 `declare(strict_types=1);`。这允许 PHP 静默地进行类型强制转换，导致意外行为和难以追踪的 bug。

## 为什么重要
- **类型安全**：防止静默类型强制转换
- **尽早发现错误**：抛出 TypeError 而非静默产生 bug
- **PER 编码风格**：现代 PHP 标准要求
- **行为可预测**：类型转换不会带来意外
- **更好的 IDE 支持**：支持更强的静态分析

## ❌ 错误示例

```php
<?php

// ❌ 缺少 declare(strict_types=1);

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;

final class CreateOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    // 没有严格类型时，会接受 "123" 作为 int
    public function handle(int $userId, array $items): void
    {
        // 此处发生静默类型强制转换
        // "123" 变成 123
        // "abc" 变成 0（！）
        $order = $this->orderRepository->create($userId, $items);
    }
}
```

**问题所在**：
```php
// 没有 strict_types 时，以下代码可以运行但不应该：
$service->handle("123", []); // 字符串 "123" 被静默转为 int 123
$service->handle("abc", []); // 字符串 "abc" 被静默转为 int 0（！）
```

## ✅ 正确示例

```php
<?php

declare(strict_types=1); // ✅ 始终在 <?php 后的第一行

namespace app\service\order;

use app\contract\repository\OrderRepositoryInterface;
use app\domain\order\entity\Order;

final class CreateOrderService
{
    public function __construct(
        private readonly OrderRepositoryInterface $orderRepository
    ) {
    }

    public function handle(int $userId, array $items): Order
    {
        // 有严格类型时，仅接受 int
        $order = $this->orderRepository->create($userId, $items);
        return $order;
    }
}
```

**有严格类型时**：
```php
// 以下会立即抛出 TypeError：
$service->handle("123", []); // TypeError: must be of type int, string given
$service->handle("abc", []); // TypeError: must be of type int, string given

// 仅以下可以运行：
$service->handle(123, []); // ✅ 正确
```

## 完整示例

```php
<?php

declare(strict_types=1); // ✅ 第 3 行，紧跟开头标签

namespace app\domain\order\value_object;

final class Money
{
    private function __construct(
        private readonly int $cents // 严格强制类型
    ) {
        if ($cents < 0) {
            throw new \InvalidArgumentException('Money cannot be negative');
        }
    }

    public static function fromCents(int $cents): self
    {
        return new self($cents);
    }

    public static function fromDollars(float $dollars): self
    {
        return new self((int) round($dollars * 100));
    }

    public function toCents(): int
    {
        return $this->cents;
    }

    public function toDollars(): float
    {
        return $this->cents / 100;
    }
}
```

**使用严格类型**：
```php
<?php

declare(strict_types=1);

// ✅ 正确用法
$money = Money::fromCents(1000);
$money = Money::fromDollars(10.50);

// ❌ 以下会抛出 TypeError
$money = Money::fromCents("1000");    // TypeError
$money = Money::fromDollars("10.50"); // TypeError
```

## 文件结构

每个 PHP 文件必须遵循以下顺序：

```php
<?php                           // 第 1 行：开头标签
                                // 第 2 行：空行
declare(strict_types=1);        // 第 3 行：严格类型（必须）
                                // 第 4 行：空行
namespace app\domain\order;     // 第 5 行：命名空间
                                // 第 6 行：空行
use app\domain\shared\Money;    // 第 7 行起：use 语句
use app\domain\order\OrderItem;
                                // 类声明前空行
final class Order               // 类声明
{
    // 类体
}
```

## 检测

**代码审查清单**：
- [ ] 每个 `.php` 文件都有 `declare(strict_types=1);`？
- [ ] 声明在第 3 行（`<?php` 和空行之后）？
- [ ] `declare` 和 `(strict_types=1)` 之间无空格？
- [ ] 末尾有分号？

**PHPStan 规则**（内置）：
```neon
# phpstan.neon
parameters:
    level: 8
    checkMissingStrictTypes: true
```

**Pint/PHP-CS-Fixer 规则**：
```php
// .php-cs-fixer.php
return (new PhpCsFixer\Config())
    ->setRules([
        'declare_strict_types' => true,
    ]);
```

**Grep 命令**：
```bash
# 查找缺少 strict_types 的 PHP 文件
grep -L "declare(strict_types=1)" app/**/*.php
```

## 常见错误

### ❌ 位置错误
```php
<?php

namespace app\domain\order; // ❌ 命名空间在 declare 之前

declare(strict_types=1);
```

### ❌ 语法错误
```php
<?php

declare (strict_types=1);  // ❌ 括号前有空格
declare(strict_types = 1); // ❌ 等号两侧有空格
declare(strict_types=1)    // ❌ 缺少分号
```

### ✅ 正确
```php
<?php

declare(strict_types=1);

namespace app\domain\order;
```

## 迁移指南

为现有文件添加严格类型：

1. **添加声明**到每个 PHP 文件：
```bash
# 查找缺少 strict_types 的文件
find app -name "*.php" -exec grep -L "declare(strict_types=1)" {} \;
```

2. 添加后**运行测试** - 你会发现类型问题：
```bash
vendor/bin/pest
```

3. **逐一修复类型错误**：
```php
// 修改前：静默强制转换
function process($id) { ... }

// 修改后：显式类型
function process(int $id): void { ... }
```

4. 使用 **Pint** 自动修复：
```bash
vendor/bin/pint --config=pint.json
```

## 相关规则
- [complete-type-declarations](complete-type-declarations.md) - 为所有参数添加类型
- [prefer-final-classes](prefer-final-classes.md) - 默认使用 final
- [readonly-properties](readonly-properties.md) - 使用 readonly 实现不可变性
