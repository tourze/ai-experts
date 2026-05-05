---
title: TestDox 生成可执行规格说明
impact: HIGH
impactDescription: 人类可读的测试输出作为文档
tags: documentation, testdox, specifications, output
---

## TestDox 生成可执行规格说明

**影响：高（人类可读的测试输出作为文档）**

启用 TestDox 输出，将测试方法名转换为可读的规格说明。当测试方法使用 `it_` snake_case 命名时，TestDox 自动生成文档风格的输出。

使用 `--testdox` 标志运行，或在 `phpunit.xml` 中配置始终生成 TestDox 输出。

**错误（默认输出，非人类可读）：**

```
PHPUnit 11.5.0 by Sebastian Bergmann and contributors.

...                                                                 3 / 3 (100%)
```

**正确（命名良好的测试产生的 TestDox 输出）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\ShoppingCart;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class ShoppingCartTest extends TestCase
{
    #[Test]
    public function it_starts_empty(): void
    {
        $cart = new ShoppingCart();

        $this->assertCount(0, $cart->getItems());
    }

    #[Test]
    public function it_adds_item_to_cart(): void
    {
        $cart = new ShoppingCart();

        $cart->addItem('Widget', 9.99);

        $this->assertCount(1, $cart->getItems());
    }

    #[Test]
    public function it_calculates_total(): void
    {
        $cart = new ShoppingCart();
        $cart->addItem('Widget', 9.99);
        $cart->addItem('Gadget', 14.99);

        $this->assertSame(24.98, $cart->getTotal());
    }
}
```

运行 `phpunit --testdox` 产生：
```
Shopping Cart
 ✔ It starts empty
 ✔ It adds item to cart
 ✔ It calculates total
```

参考：[PHPUnit TestDox](https://docs.phpunit.de/en/11.5/textui.html#testdox)
