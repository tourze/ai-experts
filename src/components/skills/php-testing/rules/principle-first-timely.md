---
title: 及时测试
impact: HIGH
impactDescription: 与生产代码同步编写测试
tags: testing, first, timely, tdd, workflow
---

## 及时测试

**影响：高（与生产代码同步编写测试）**

FIRST 原则中的"T"代表 Timely（及时）。测试应与其验证的生产代码同时（或之前）编写。事后编写的测试往往只是确认现有行为，而非驱动良好的设计。

及时的测试能尽早发现缺陷、引导 API 设计，并作为最新的文档。

**错误（事后编写的测试，测试了实现细节）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\PasswordHasher;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class PasswordHasherTest extends TestCase
{
    #[Test]
    public function it_hashes_password(): void
    {
        $hasher = new PasswordHasher();

        $hash = $hasher->hash('secret123');

        // 测试内部实现细节（算法 + 前缀）
        $this->assertStringStartsWith('$2y$', $hash);
        $this->assertSame(60, strlen($hash));
    }
}
```

**正确（测试驱动行为，与代码同步编写）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\PasswordHasher;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class PasswordHasherTest extends TestCase
{
    #[Test]
    public function it_verifies_a_correct_password(): void
    {
        $hasher = new PasswordHasher();

        $hash = $hasher->hash('secret123');

        $this->assertTrue($hasher->verify('secret123', $hash));
    }

    #[Test]
    public function it_rejects_an_incorrect_password(): void
    {
        $hasher = new PasswordHasher();

        $hash = $hasher->hash('secret123');

        $this->assertFalse($hasher->verify('wrong', $hash));
    }
}
```
