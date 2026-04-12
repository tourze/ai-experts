---
title: 芝加哥 vs 伦敦 TDD 流派
impact: MEDIUM
impactDescription: 选择正确的 Mock 策略
tags: mocking, tdd, chicago, london, strategy
---

## 芝加哥 vs 伦敦 TDD 流派

**影响：中（选择正确的 Mock 策略）**

理解两大 TDD 流派：**芝加哥**（经典派）通过公共 API 使用真实协作者进行测试，而**伦敦**（Mock 派）通过 Mock 所有依赖来隔离被测系统。根据上下文选择——芝加哥在集成方面提供更多信心，伦敦提供更快、更聚焦的测试。

对大多数 PHPUnit 项目，务实的中间路线最有效：对值对象和简单协作者使用真实对象，对 I/O 边界（数据库、HTTP、文件系统）使用 Mock。

**错误（过度使用伦敦风格——Mock 值对象）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Money;
use App\PriceCalculator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class PriceCalculatorTest extends TestCase
{
    #[Test]
    public function it_calculates_total(): void
    {
        // Mock 简单值对象——不必要且脆弱
        $price = $this->createMock(Money::class);
        $price->method('getAmount')->willReturn(100);
        $price->method('getCurrency')->willReturn('EUR');

        $calculator = new PriceCalculator();

        $result = $calculator->addTax($price, 0.20);

        $this->assertSame(120, $result->getAmount());
    }
}
```

**正确（芝加哥风格——真实值对象，Mock I/O 边界）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Money;
use App\PriceCalculator;
use App\TaxRateProviderInterface;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class PriceCalculatorTest extends TestCase
{
    #[Test]
    public function it_calculates_total_with_tax(): void
    {
        $price = new Money(100, 'EUR'); // 真实值对象
        $taxProvider = $this->createStub(TaxRateProviderInterface::class);
        $taxProvider->method('rateFor')->willReturn(0.20); // Stub I/O 边界
        $calculator = new PriceCalculator($taxProvider);

        $result = $calculator->addTax($price);

        $this->assertSame(120, $result->getAmount());
    }
}
```
