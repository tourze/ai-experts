---
title: "#[TestDox] 属性自定义显示"
impact: MEDIUM
impactDescription: 超越方法名的自定义测试描述
tags: documentation, testdox, attribute, display
---

## #[TestDox] 属性自定义显示

**影响：中（超越方法名的自定义测试描述）**

当测试方法名无法完整表达规格说明时，使用 `#[TestDox('description')]` 属性。该属性支持使用 `$parameterName` 语法对数据提供者的值进行变量插值。

谨慎使用——命名良好的方法对大多数场景应该已经足够。

**错误（方法名不清晰，无 TestDox）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\PriceCalculator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class PriceCalculatorTest extends TestCase
{
    #[Test]
    #[DataProvider('vatProvider')]
    public function it_calculates_price_with_vat(float $price, string $country, float $expected): void
    {
        $calculator = new PriceCalculator();

        $this->assertSame($expected, $calculator->withVat($price, $country));
    }

    public static function vatProvider(): iterable
    {
        yield [100.0, 'FR', 120.0];
        yield [100.0, 'DE', 119.0];
    }
}
```

**正确（带变量插值的 #[TestDox]）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\PriceCalculator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\TestDox;
use PHPUnit\Framework\TestCase;

final class PriceCalculatorTest extends TestCase
{
    #[Test]
    #[DataProvider('vatProvider')]
    #[TestDox('A price of €$price in $country results in €$expected with VAT')]
    public function it_calculates_price_with_vat(float $price, string $country, float $expected): void
    {
        $calculator = new PriceCalculator();

        $this->assertSame($expected, $calculator->withVat($price, $country));
    }

    public static function vatProvider(): iterable
    {
        yield 'France 20% VAT' => [100.0, 'FR', 120.0];
        yield 'Germany 19% VAT' => [100.0, 'DE', 119.0];
    }
}
```

TestDox 输出：
```
Price Calculator
 ✔ A price of €100 in FR results in €120 with VAT
 ✔ A price of €100 in DE results in €119 with VAT
```

参考：[PHPUnit TestDox Attribute](https://docs.phpunit.de/en/11.5/attributes.html#testdox)
