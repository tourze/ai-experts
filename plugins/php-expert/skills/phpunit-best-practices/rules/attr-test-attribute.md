---
title: 使用 #[Test] 属性配合 it_ 前缀
impact: CRITICAL
impactDescription: 现代化的类型安全测试发现机制
tags: attributes, test, discovery, php8, naming
---

## 使用 #[Test] 属性配合 it_ 前缀

**影响：关键（现代化的类型安全测试发现机制）**

使用 `#[Test]` 属性代替 `test` 方法名前缀。结合 `it_` snake_case 命名约定，创建高度可读的测试方法，作为规格说明。

`#[Test]` 属性是 PHP 8 原生属性，替代了遗留的 `@test` PHPDoc 注解。它是类型安全的、重构友好的，且 IDE 支持良好。

**错误（test 前缀）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\TestCase;

final class UserTest extends TestCase
{
    public function testItCreatesUserWithValidEmail(): void
    {
        // 方法名带 'test' 前缀显得冗余
    }

    /** @test */
    public function itCreatesUserWithValidEmail(): void
    {
        // PHPDoc 注解——非类型安全，无 IDE 导航
    }
}
```

**正确（#[Test] 属性配合 it_ 前缀）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\User;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class UserTest extends TestCase
{
    #[Test]
    public function it_creates_user_with_valid_email(): void
    {
        $user = new User('john@example.com');

        $this->assertSame('john@example.com', $user->getEmail());
    }

    #[Test]
    public function it_rejects_invalid_email(): void
    {
        $this->expectException(\InvalidArgumentException::class);

        new User('not-an-email');
    }
}
```

参考：[PHPUnit Attributes](https://docs.phpunit.de/en/11.5/attributes.html#test)
