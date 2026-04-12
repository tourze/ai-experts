---
title: 断言优先使用 $this 而非 self
impact: MEDIUM
impactDescription: 一致的断言风格和更好的 IDE 支持
tags: standards, assertions, this, self, consistency
---

## 断言优先使用 $this 而非 self

**影响：中（一致的断言风格和更好的 IDE 支持）**

所有断言使用 `$this->assert*()` 而非 `self::assert*()`。虽然两者都有效，但 `$this->` 是 PHPUnit 文档推荐的约定风格。它提供更好的 IDE 自动补全，并与其他实例方法的调用方式保持一致。

**错误（混用 self:: 和 $this->）：**

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

        $result = $calculator->add(2, 3);

        self::assertSame(5, $result);
    }

    #[Test]
    public function it_subtracts_numbers(): void
    {
        $calculator = new Calculator();

        $result = $calculator->subtract(5, 3);

        self::assertSame(2, $result);
    }
}
```

**正确（一致使用 $this->）：**

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

        $result = $calculator->add(2, 3);

        $this->assertSame(5, $result);
    }

    #[Test]
    public function it_subtracts_numbers(): void
    {
        $calculator = new Calculator();

        $result = $calculator->subtract(5, 3);

        $this->assertSame(2, $result);
    }
}
```
