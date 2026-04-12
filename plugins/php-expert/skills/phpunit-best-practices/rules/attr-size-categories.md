---
title: 大小属性分类测试
impact: HIGH
impactDescription: 按类别强制执行时间限制
tags: attributes, size, small, medium, large, categorization
---

## 大小属性分类测试

**影响：高（按类别强制执行时间限制）**

使用 `#[Small]`、`#[Medium]` 和 `#[Large]` 属性按预期执行时间分类测试。PHPUnit 强制执行时间限制：Small 测试必须在 1 秒内完成，Medium 在 10 秒内，Large 在 60 秒内。

这防止单元测试静默变慢，并帮助按速度组织测试执行。

**错误（无大小分类）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Calculator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

// 无大小属性——无执行时间限制
final class CalculatorTest extends TestCase
{
    #[Test]
    public function it_adds_numbers(): void
    {
        $calculator = new Calculator();

        $result = $calculator->add(2, 3);

        $this->assertSame(5, $result);
    }
}
```

**正确（应用了大小属性）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests\Unit;

use App\Calculator;
use PHPUnit\Framework\Attributes\Small;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

#[Small]
final class CalculatorTest extends TestCase
{
    #[Test]
    public function it_adds_numbers(): void
    {
        $calculator = new Calculator();

        $result = $calculator->add(2, 3);

        $this->assertSame(5, $result);
    }
}
```

大小限制：`#[Small]` = 1 秒，`#[Medium]` = 10 秒，`#[Large]` = 60 秒。在 `phpunit.xml` 中设置 `enforceTimeLimit="true"` 启用强制执行。

参考：[PHPUnit Test Size](https://docs.phpunit.de/en/11.5/attributes.html#small)
