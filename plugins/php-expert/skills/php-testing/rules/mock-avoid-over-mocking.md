---
title: 避免过度 Mock 内部依赖
impact: MEDIUM
impactDescription: 测试应验证行为而非实现
tags: mocking, over-mocking, fragile, behavior, implementation
---

## 避免过度 Mock 内部依赖

**影响：中（测试应验证行为而非实现）**

不要 Mock 所有东西——仅在架构边界处 Mock（I/O、外部服务、时间）。Mock 内部类会使测试与实现细节耦合，在不改变行为的重构中也会破坏测试。

好的规则：如果能低成本实例化且无副作用，使用真实对象。

**错误（Mock 内部类）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Discount;
use App\Order;
use App\OrderItem;
use App\PriceCalculator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class PriceCalculatorTest extends TestCase
{
    #[Test]
    public function it_calculates_discounted_price(): void
    {
        // Mock 内部值对象——脆弱且无意义
        $item = $this->createMock(OrderItem::class);
        $item->method('getPrice')->willReturn(100.0);
        $item->method('getQuantity')->willReturn(2);

        $discount = $this->createMock(Discount::class);
        $discount->method('getPercentage')->willReturn(10.0);

        $order = $this->createMock(Order::class);
        $order->method('getItems')->willReturn([$item]);
        $order->method('getDiscount')->willReturn($discount);

        $calculator = new PriceCalculator();

        $this->assertSame(180.0, $calculator->calculate($order));
    }
}
```

**正确（内部用真实对象，仅 Mock 边界）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Discount;
use App\Order;
use App\OrderItem;
use App\PriceCalculator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class PriceCalculatorTest extends TestCase
{
    #[Test]
    public function it_calculates_discounted_price(): void
    {
        $order = new Order(
            items: [new OrderItem('Widget', price: 100.0, quantity: 2)],
            discount: new Discount(percentage: 10.0),
        );
        $calculator = new PriceCalculator();

        $result = $calculator->calculate($order);

        $this->assertSame(180.0, $result);
    }
}
```
