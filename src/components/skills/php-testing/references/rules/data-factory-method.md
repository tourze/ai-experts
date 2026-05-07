---
title: 工厂方法实例化被测系统
impact: MEDIUM-HIGH
impactDescription: 构造器更新时只需修改一处
tags: data, factory, instantiation, sut, maintainability
---

## 工厂方法实例化被测系统

**影响：中高（构造器更新时只需修改一处）**

当被测系统（SUT）的构造器有多个参数时，在测试类中创建一个 private 工厂方法。这样在构造器签名变化时，只需修改一个地方，而非更新每个测试方法。

在工厂方法中使用命名参数，使覆盖值可读且自文档化。

**错误（跨测试重复实例化）：**

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
    public function it_returns_full_name(): void
    {
        $user = new User('John', 'Doe', 'john@example.com', 30, 'admin');

        $this->assertSame('John Doe', $user->getFullName());
    }

    #[Test]
    public function it_checks_admin_role(): void
    {
        $user = new User('Jane', 'Doe', 'jane@example.com', 25, 'admin');

        $this->assertTrue($user->isAdmin());
    }
}
```

**正确（使用命名参数的工厂方法）：**

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
    public function it_returns_full_name(): void
    {
        $user = $this->createUser(firstName: 'John', lastName: 'Doe');

        $this->assertSame('John Doe', $user->getFullName());
    }

    #[Test]
    public function it_checks_admin_role(): void
    {
        $user = $this->createUser(role: 'admin');

        $this->assertTrue($user->isAdmin());
    }

    private function createUser(
        string $firstName = 'Default',
        string $lastName = 'User',
        string $email = 'default@example.com',
        int $age = 25,
        string $role = 'user',
    ): User {
        return new User($firstName, $lastName, $email, $age, $role);
    }
}
```
