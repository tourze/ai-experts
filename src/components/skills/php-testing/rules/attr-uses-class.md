---
title: "#[UsesClass] 文档化依赖"
impact: HIGH
impactDescription: 显式依赖文档和严格覆盖率
tags: attributes, uses-class, dependencies, coverage
---

## #[UsesClass] 文档化依赖

**影响：高（显式依赖文档和严格覆盖率）**

启用严格覆盖率模式时，PHPUnit 要求测试执行期间的每个类要么被覆盖，要么被声明为"使用"。`#[UsesClass]` 属性文档化测试所使用的依赖，但不声称覆盖它们。

这创建了一个显式的依赖映射，防止误报的"非预期覆盖代码"警告。

**错误（严格模式下缺少 UsesClass）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\OrderProcessor;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

#[CoversClass(OrderProcessor::class)]
final class OrderProcessorTest extends TestCase
{
    #[Test]
    public function it_processes_order(): void
    {
        // OrderProcessor 内部创建了 Order 和 OrderResult
        // 在严格覆盖率模式下，PHPUnit 会警告这些是
        // "非预期覆盖的"
        $processor = new OrderProcessor();
        $result = $processor->process(orderId: 42);

        $this->assertTrue($result->isSuccessful());
    }
}
```

**正确（为依赖添加 #[UsesClass]）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Order;
use App\OrderProcessor;
use App\OrderResult;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\UsesClass;
use PHPUnit\Framework\TestCase;

#[CoversClass(OrderProcessor::class)]
#[UsesClass(Order::class)]
#[UsesClass(OrderResult::class)]
final class OrderProcessorTest extends TestCase
{
    #[Test]
    public function it_processes_order(): void
    {
        $processor = new OrderProcessor();

        $result = $processor->process(orderId: 42);

        $this->assertTrue($result->isSuccessful());
    }
}
```

参考：[PHPUnit UsesClass](https://docs.phpunit.de/en/11.5/attributes.html#usesclass)
