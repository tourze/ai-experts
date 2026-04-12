---
title: Arrange-Act-Assert 模式
impact: CRITICAL
impactDescription: 测试结构清晰的基础模式
tags: testing, structure, aaa, arrange, act, assert
---

## Arrange-Act-Assert 模式

**影响：关键（测试结构清晰的基础模式）**

将每个测试方法结构化为三个明确的阶段：**Arrange**（准备前置条件）、**Act**（执行被测行为）、**Assert**（验证预期结果）。这一模式使测试具有自文档化特性，更易于维护。

各阶段之间用空行分隔以提高视觉清晰度。Act 阶段通常应该只有一行——如果需要多个动作，说明你可能测试了太多内容。

**错误（阶段混杂，结构不清晰）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Calculator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class CalculatorTest extends TestCase
{
    #[Test]
    public function it_adds_numbers(): void
    {
        $calculator = new Calculator();
        self::assertSame(4, $calculator->add(2, 2));
        self::assertSame(0, $calculator->add(-1, 1));
        $calculator2 = new Calculator();
        self::assertSame(10, $calculator2->add(5, 5));
    }
}
```

**正确（清晰的 AAA 分离）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Calculator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class CalculatorTest extends TestCase
{
    #[Test]
    public function it_adds_two_positive_numbers(): void
    {
        $calculator = new Calculator();

        $result = $calculator->add(2, 2);

        $this->assertSame(4, $result);
    }
}
```
