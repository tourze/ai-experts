---
title: 隔离测试
impact: CRITICAL
impactDescription: 测试之间不得相互依赖
tags: testing, first, isolated, independent, state
---

## 隔离测试

**影响：关键（测试之间不得相互依赖）**

FIRST 原则中的"I"代表 Isolated（隔离）。每个测试必须完全独立——不应依赖其他测试的结果或副作用。测试必须能够以任意顺序运行并仍然通过。

避免共享可变状态、静态属性和全局变量。使用 `setUp()` 为每个测试创建全新的 fixture。

**错误（测试共享状态）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\ShoppingCart;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class ShoppingCartTest extends TestCase
{
    private static ShoppingCart $cart;

    public static function setUpBeforeClass(): void
    {
        self::$cart = new ShoppingCart();
    }

    #[Test]
    public function it_adds_an_item(): void
    {
        self::$cart->addItem('Apple', 1.50);

        $this->assertCount(1, self::$cart->getItems());
    }

    #[Test]
    public function it_calculates_total(): void
    {
        // 依赖前一个测试已添加 'Apple'
        $this->assertSame(1.50, self::$cart->getTotal());
    }
}
```

**正确（每个测试拥有独立状态）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\ShoppingCart;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class ShoppingCartTest extends TestCase
{
    private ShoppingCart $cart;

    protected function setUp(): void
    {
        $this->cart = new ShoppingCart();
    }

    #[Test]
    public function it_adds_an_item(): void
    {
        $this->cart->addItem('Apple', 1.50);

        $this->assertCount(1, $this->cart->getItems());
    }

    #[Test]
    public function it_calculates_total_for_single_item(): void
    {
        $this->cart->addItem('Apple', 1.50);

        $this->assertSame(1.50, $this->cart->getTotal());
    }
}
```
