---
title: 自验证测试
impact: HIGH
impactDescription: 明确的通过或失败，无需人工检查
tags: testing, first, self-validating, assertions
---

## 自验证测试

**影响：高（明确的通过或失败，无需人工检查）**

FIRST 原则中的"S"代表 Self-Validating（自验证）。每个测试必须有明确的布尔结果——要么通过，要么失败。永远不要求人工检查输出、日志文件或数据库状态来判断测试是否通过。

使用具体的断言而非输出值。避免在测试中使用 `var_dump()`、`echo` 或 `print_r()`。

**错误（需要人工检查）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\InvoiceGenerator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class InvoiceGeneratorTest extends TestCase
{
    #[Test]
    public function it_generates_invoice(): void
    {
        $generator = new InvoiceGenerator();

        $invoice = $generator->generate(orderId: 42);

        // 需要人工检查——不是自验证的
        var_dump($invoice);
        echo $invoice->getTotal();
    }
}
```

**正确（显式断言）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\InvoiceGenerator;
use App\Order;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class InvoiceGeneratorTest extends TestCase
{
    #[Test]
    public function it_generates_invoice_with_correct_total(): void
    {
        $order = new Order(items: [['name' => 'Widget', 'price' => 9.99, 'qty' => 2]]);
        $generator = new InvoiceGenerator();

        $invoice = $generator->generate($order);

        $this->assertSame(19.98, $invoice->getTotal());
        $this->assertSame(42, $invoice->getOrderId());
    }
}
```
