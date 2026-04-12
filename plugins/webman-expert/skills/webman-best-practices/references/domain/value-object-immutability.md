# 值对象不可变性

## 影响程度
**高** - 可变值对象会导致不可预测的行为和 bug。

## 问题
值对象创建后仍可被修改。值对象应该是不可变的——一旦创建，其状态不可更改。如果需要不同的值，应创建新的值对象。

## 为什么重要
- **可预测性**：不可变对象行为一致
- **线程安全**：不可变对象不存在竞态条件
- **哈希稳定性**：可以安全地用作数组键或集合元素
- **DDD 原则**：值对象由其值定义，而非标识
- **防止 bug**：不会因意外修改而破坏业务逻辑

## ❌ 错误示例

```php
<?php

declare(strict_types=1);

namespace app\domain\order\value_object;

final class Money
{
    // ❌ 公共属性允许修改
    public int $cents;

    public function __construct(int $cents)
    {
        $this->cents = $cents;
    }

    // ❌ Setter 允许修改
    public function setCents(int $cents): void
    {
        $this->cents = $cents;
    }

    // ❌ 方法修改了内部状态
    public function add(Money $other): void
    {
        $this->cents += $other->cents;
    }
}
```

**问题所在**：
```php
$price = new Money(1000);
$price->cents = 2000; // ❌ 可以被修改！
$price->setCents(3000); // ❌ 可以被修改！

$total = new Money(1000);
$total->add(new Money(500)); // ❌ 修改了 $total
// 现在 $total 是 1500，但我们丢失了原始值
```

## ✅ 正确示例

```php
<?php

declare(strict_types=1);

namespace app\domain\order\value_object;

final class Money
{
    // ✅ 私有 readonly 属性 - 不可更改
    private function __construct(
        private readonly int $cents
    ) {
        if ($cents < 0) {
            throw new \InvalidArgumentException('Money cannot be negative');
        }
    }

    // ✅ 命名构造函数
    public static function fromCents(int $cents): self
    {
        return new self($cents);
    }

    public static function fromDollars(float $dollars): self
    {
        return new self((int) round($dollars * 100));
    }

    public static function zero(): self
    {
        return new self(0);
    }

    // ✅ 操作返回新实例
    public function add(self $other): self
    {
        return new self($this->cents + $other->cents);
    }

    public function subtract(self $other): self
    {
        return new self($this->cents - $other->cents);
    }

    public function multiply(int $factor): self
    {
        return new self($this->cents * $factor);
    }

    // ✅ 仅有 getter，无 setter
    public function toCents(): int
    {
        return $this->cents;
    }

    public function toDollars(): float
    {
        return $this->cents / 100;
    }

    // ✅ 基于值的相等性
    public function equals(self $other): bool
    {
        return $this->cents === $other->cents;
    }

    public function isGreaterThan(self $other): bool
    {
        return $this->cents > $other->cents;
    }
}
```

**正确用法**：
```php
$price = Money::fromCents(1000);
// $price->cents = 2000; // ❌ 编译错误：无法访问私有属性
// $price->setCents(3000); // ❌ 编译错误：方法不存在

// ✅ 操作创建新实例
$total = Money::fromCents(1000);
$newTotal = $total->add(Money::fromCents(500));
// $total 仍然是 1000
// $newTotal 是 1500
```

## 完整示例：Address 值对象

```php
<?php

declare(strict_types=1);

namespace app\domain\order\value_object;

final class Address
{
    private function __construct(
        private readonly string $street,
        private readonly string $city,
        private readonly string $state,
        private readonly string $zipCode,
        private readonly string $country
    ) {
        $this->validate();
    }

    public static function create(
        string $street,
        string $city,
        string $state,
        string $zipCode,
        string $country
    ): self {
        return new self($street, $city, $state, $zipCode, $country);
    }

    private function validate(): void
    {
        if (empty($this->street)) {
            throw new \InvalidArgumentException('Street cannot be empty');
        }

        if (empty($this->city)) {
            throw new \InvalidArgumentException('City cannot be empty');
        }

        if (!preg_match('/^\d{5}(-\d{4})?$/', $this->zipCode)) {
            throw new \InvalidArgumentException('Invalid ZIP code format');
        }
    }

    // ✅ 返回修改了某个值的新实例
    public function withStreet(string $street): self
    {
        return new self($street, $this->city, $this->state, $this->zipCode, $this->country);
    }

    public function withCity(string $city): self
    {
        return new self($this->street, $city, $this->state, $this->zipCode, $this->country);
    }

    // 访问器
    public function street(): string
    {
        return $this->street;
    }

    public function city(): string
    {
        return $this->city;
    }

    public function state(): string
    {
        return $this->state;
    }

    public function zipCode(): string
    {
        return $this->zipCode;
    }

    public function country(): string
    {
        return $this->country;
    }

    public function equals(self $other): bool
    {
        return $this->street === $other->street
            && $this->city === $other->city
            && $this->state === $other->state
            && $this->zipCode === $other->zipCode
            && $this->country === $other->country;
    }

    public function toArray(): array
    {
        return [
            'street' => $this->street,
            'city' => $this->city,
            'state' => $this->state,
            'zip_code' => $this->zipCode,
            'country' => $this->country,
        ];
    }
}
```

## 检测

**代码审查清单**：
- [ ] 所有属性都是 `private readonly`？
- [ ] 没有 setter 方法？
- [ ] 操作返回新实例？
- [ ] 构造函数是私有的，使用命名构造函数？
- [ ] 构造函数中有校验？

**PHPStan 规则**（自定义）：
```php
// 检测可变值对象
if (class in domain/value_object && has_public_property) {
    report("Value object properties must be private readonly");
}

if (class in domain/value_object && has_setter_method) {
    report("Value objects should not have setters");
}
```

## 相关规则
- [entity-identity](entity-identity.md) - 实体 vs 值对象
- [readonly-properties](../code-style/readonly-properties.md) - 使用 readonly 关键字
