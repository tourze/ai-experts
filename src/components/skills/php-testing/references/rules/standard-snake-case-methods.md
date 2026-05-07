---
title: 测试方法名使用 Snake Case
impact: HIGH
impactDescription: 可读的方法名作为规格说明
tags: standards, naming, snake-case, readability
---

## 测试方法名使用 Snake Case

**影响：高（可读的方法名作为规格说明）**

测试方法名使用 `snake_case` 并加 `it_` 前缀。这读起来像自然语言的规格说明："it calculates total with discount"（它计算带折扣的总价）。结合 `#[Test]` 属性，消除了对 `test` 前缀的需要，同时产生可读的 TestDox 输出。

`it_` 前缀创建了主语-动词的句子结构，清晰描述预期行为。

**错误（camelCase，可读性较差）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\TestCase;

final class OrderTest extends TestCase
{
    public function testCalculatesTotalWithDiscount(): void
    {
        // ...
    }

    public function testThrowsExceptionForEmptyCart(): void
    {
        // ...
    }
}
```

**正确（snake_case 配合 it_ 前缀）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Order;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class OrderTest extends TestCase
{
    #[Test]
    public function it_calculates_total_with_discount(): void
    {
        // 自然阅读："it calculates total with discount"
    }

    #[Test]
    public function it_throws_exception_for_empty_cart(): void
    {
        // 自然阅读："it throws exception for empty cart"
    }
}
```
