---
title: "#[CoversClass] 界定覆盖率边界"
impact: HIGH
impactDescription: 精确的覆盖率指标和有意识的测试
tags: attributes, coverage, covers-class, metrics
---

## #[CoversClass] 界定覆盖率边界

**影响：高（精确的覆盖率指标和有意识的测试）**

在类级别使用 `#[CoversClass(ClassName::class)]` 声明测试覆盖哪个生产类。这确保代码覆盖率指标只计算被有意测试的行，防止集成副作用导致的覆盖率虚增。

此属性替代了遗留的 `@covers` 注解，使用类引用以确保重构安全。

**错误（无覆盖率边界）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\OrderProcessor;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

// 无覆盖率边界——测试期间执行的任何代码
// 都会计入覆盖率，导致指标虚增
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

**正确（声明了 #[CoversClass]）：**

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
        $processor = new OrderProcessor();

        $result = $processor->process(orderId: 42);

        $this->assertTrue($result->isSuccessful());
    }
}
```

参考：[PHPUnit CoversClass](https://docs.phpunit.de/en/11.5/attributes.html#coversclass)
