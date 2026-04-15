---
title: DRY 与 DAMP 的平衡
impact: MEDIUM
impactDescription: 测试中可读性优先于抽象
tags: testing, dry, damp, readability, duplication
---

## DRY 与 DAMP 的平衡

**影响：中（测试中可读性优先于抽象）**

在测试中，优先选择 **DAMP**（Descriptive And Meaningful Phrases，描述性且有意义的表述）而非严格的 DRY（Don't Repeat Yourself）。测试中适度的重复是可接受的——甚至是可取的——当它使每个测试自包含且可读时。过度将测试准备抽象到共享辅助方法中会使测试更难理解。

仅在减少噪音且不隐藏重要上下文时提取共享准备代码。阅读者应该无需跳转到其他方法就能理解一个测试。

**错误（过度抽象，隐藏上下文）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Order;
use App\OrderProcessor;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class OrderProcessorTest extends TestCase
{
    #[Test]
    public function it_processes_standard_order(): void
    {
        [$processor, $order] = $this->createDefaultSetup();

        $result = $processor->process($order);

        $this->assertTrue($result->isSuccessful());
    }

    #[Test]
    public function it_applies_discount_to_premium_order(): void
    {
        [$processor, $order] = $this->createDefaultSetup('premium');

        $result = $processor->process($order);

        // 什么折扣？什么使它成为 premium？不清楚。
        $this->assertSame(90.0, $result->getTotal());
    }

    private function createDefaultSetup(string $type = 'standard'): array
    {
        // 20 行准备代码隐藏在这里...
    }
}
```

**正确（DAMP——每个测试讲述自己的故事）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Order;
use App\OrderItem;
use App\OrderProcessor;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class OrderProcessorTest extends TestCase
{
    #[Test]
    public function it_processes_standard_order(): void
    {
        $order = new Order(
            items: [new OrderItem('Widget', price: 25.0, quantity: 2)],
            type: 'standard',
        );
        $processor = new OrderProcessor();

        $result = $processor->process($order);

        $this->assertTrue($result->isSuccessful());
        $this->assertSame(50.0, $result->getTotal());
    }

    #[Test]
    public function it_applies_10_percent_discount_to_premium_order(): void
    {
        $order = new Order(
            items: [new OrderItem('Widget', price: 100.0, quantity: 1)],
            type: 'premium',
        );
        $processor = new OrderProcessor();

        $result = $processor->process($order);

        $this->assertTrue($result->isSuccessful());
        $this->assertSame(90.0, $result->getTotal());
    }
}
```
