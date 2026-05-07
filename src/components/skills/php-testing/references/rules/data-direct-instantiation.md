---
title: 简单构造器直接实例化
impact: MEDIUM
impactDescription: 保持简单测试的简单性
tags: data, instantiation, simple, constructor, clarity
---

## 简单构造器直接实例化

**影响：中（保持简单测试的简单性）**

当被测系统有简单构造器（1-2 个参数）时，在每个测试方法中直接实例化。不要为简单场景过度工程化，使用工厂方法或 setUp()，因为内联构造是清晰的。

工厂方法在构造器有 3 个以上参数或签名频繁变化时才有价值。对于简单场景，直接实例化可读性更好。

**错误（为简单构造器创建不必要的工厂）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Money;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class MoneyTest extends TestCase
{
    #[Test]
    public function it_adds_same_currency(): void
    {
        $a = $this->createMoney(100, 'EUR');
        $b = $this->createMoney(200, 'EUR');

        $result = $a->add($b);

        $this->assertSame(300, $result->getAmount());
    }

    private function createMoney(int $amount = 0, string $currency = 'EUR'): Money
    {
        return new Money($amount, $currency);
    }
}
```

**正确（简单构造器直接实例化）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Money;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class MoneyTest extends TestCase
{
    #[Test]
    public function it_adds_same_currency(): void
    {
        $a = new Money(100, 'EUR');
        $b = new Money(200, 'EUR');

        $result = $a->add($b);

        $this->assertSame(300, $result->getAmount());
    }

    #[Test]
    public function it_rejects_different_currencies(): void
    {
        $eur = new Money(100, 'EUR');
        $usd = new Money(100, 'USD');

        $this->expectException(\InvalidArgumentException::class);

        $eur->add($usd);
    }
}
```
