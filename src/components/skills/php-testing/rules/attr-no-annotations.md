---
title: 优先使用 PHP 8 属性而非 PHPDoc 注解
impact: MEDIUM
impactDescription: 类型安全的、IDE 支持的元数据
tags: attributes, annotations, php8, migration, modern
---

## 优先使用 PHP 8 属性而非 PHPDoc 注解

**影响：中（类型安全的、IDE 支持的元数据）**

始终使用 PHP 8 原生属性代替 PHPDoc 注解。属性在编译时进行类型检查，支持 IDE 导航（点击跳转到定义），并且重构安全。PHPDoc 注解是纯字符串，没有类型安全性。

PHPUnit 11+ 完全支持属性，许多注解已被弃用。

**错误（遗留 PHPDoc 注解）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\OrderProcessor;
use PHPUnit\Framework\TestCase;

/**
 * @covers \App\OrderProcessor
 * @uses \App\Order
 * @group integration
 */
final class OrderProcessorTest extends TestCase
{
    /**
     * @test
     * @dataProvider orderProvider
     * @testdox It processes $type orders
     */
    public function it_processes_orders(string $type, float $expected): void
    {
        // ...
    }

    public function orderProvider(): array
    {
        return [
            'standard' => ['standard', 100.0],
            'premium' => ['premium', 90.0],
        ];
    }
}
```

**正确（PHP 8 属性）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Order;
use App\OrderProcessor;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\TestDox;
use PHPUnit\Framework\Attributes\UsesClass;
use PHPUnit\Framework\TestCase;

#[CoversClass(OrderProcessor::class)]
#[UsesClass(Order::class)]
#[Group('integration')]
final class OrderProcessorTest extends TestCase
{
    #[Test]
    #[DataProvider('orderProvider')]
    #[TestDox('It processes $type orders')]
    public function it_processes_orders(string $type, float $expected): void
    {
        // ...
    }

    public static function orderProvider(): array
    {
        return [
            'standard' => ['standard', 100.0],
            'premium' => ['premium', 90.0],
        ];
    }
}
```

参考：[PHPUnit Attributes](https://docs.phpunit.de/en/11.5/attributes.html)
