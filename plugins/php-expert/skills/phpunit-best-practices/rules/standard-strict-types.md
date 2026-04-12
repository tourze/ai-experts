---
title: 声明 strict_types=1
impact: CRITICAL
impactDescription: 类型安全防止隐蔽缺陷
tags: standards, strict-types, type-safety, php
---

## 声明 strict_types=1

**影响：关键（类型安全防止隐蔽缺陷）**

始终在每个测试文件顶部声明 `strict_types=1`。这确保 PHP 严格执行标量类型声明，捕获在弱模式下会静默通过的类型转换缺陷。

没有严格类型时，在需要 `int` 的地方传入 `"42"` 会静默生效——掩盖生产代码中的真实缺陷。

**错误（缺少 strict_types）：**

```php
<?php

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

        // "2" 被静默转换为 int——隐藏了潜在的缺陷
        $result = $calculator->add("2", 3);

        $this->assertSame(5, $result);
    }
}
```

**正确（声明了 strict_types=1）：**

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
}
```

参考：[PHP strict_types](https://www.php.net/manual/en/language.types.declarations.php#language.types.declarations.strict)
