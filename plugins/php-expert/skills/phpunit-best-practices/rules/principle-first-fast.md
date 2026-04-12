---
title: 快速测试
impact: CRITICAL
impactDescription: 测试必须在秒级内完成，而非分钟级
tags: testing, first, fast, performance, speed
---

## 快速测试

**影响：关键（测试必须在秒级内完成，而非分钟级）**

FIRST 原则中的"F"代表 Fast（快速）。测试应在毫秒级执行。慢速测试会阻碍频繁执行，打断反馈循环。单元测试应避免 I/O 操作（网络、文件系统、数据库），依赖内存操作。

如果测试需要外部资源，它应属于可单独运行的集成测试套件。

**错误（测试执行真实 I/O）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\UserRepository;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class UserRepositoryTest extends TestCase
{
    #[Test]
    public function it_finds_user_by_email(): void
    {
        $pdo = new \PDO('mysql:host=localhost;dbname=test', 'root', '');
        $repository = new UserRepository($pdo);

        $user = $repository->findByEmail('john@example.com');

        $this->assertSame('John', $user->getName());
    }
}
```

**正确（快速的内存测试，使用桩对象）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\User;
use App\UserRepository;
use App\UserRepositoryInterface;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class UserServiceTest extends TestCase
{
    #[Test]
    public function it_finds_user_by_email(): void
    {
        $user = new User('John', 'john@example.com');
        $repository = $this->createStub(UserRepositoryInterface::class);
        $repository->method('findByEmail')->willReturn($user);

        $result = $repository->findByEmail('john@example.com');

        $this->assertSame('John', $result->getName());
    }
}
```
