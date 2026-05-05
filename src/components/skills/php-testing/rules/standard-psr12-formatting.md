---
title: PSR-12 代码格式
impact: MEDIUM
impactDescription: 一致的格式减少审查噪音
tags: standards, psr-12, formatting, code-style
---

## PSR-12 代码格式

**影响：中（一致的格式减少审查噪音）**

对测试文件应用与生产代码相同的 PSR-12 格式。包括：4 空格缩进、命名空间后一空行、use 语句后一空行、类的左花括号在同一行、方法的左花括号在下一行。

使用 PHP-CS-Fixer 或 PHP_CodeSniffer 等工具自动执行。

**错误（格式不一致）：**

```php
<?php
declare(strict_types=1);
namespace App\Tests;
use App\Calculator;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\Attributes\Test;

final class CalculatorTest extends TestCase {
    #[Test]
    public function it_adds_numbers(): void {
        $calculator = new Calculator();
        $result = $calculator->add(2, 3);
        $this->assertSame(5, $result);
    }
}
```

**正确（符合 PSR-12）：**

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

参考：[PSR-12: Extended Coding Style Guide](https://www.php-fig.org/psr/psr-12/)
