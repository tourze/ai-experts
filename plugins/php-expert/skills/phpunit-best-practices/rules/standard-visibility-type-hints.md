---
title: 显式可见性和类型提示
impact: MEDIUM
impactDescription: 清晰的契约和 IDE 支持
tags: standards, visibility, type-hints, return-types
---

## 显式可见性和类型提示

**影响：中（清晰的契约和 IDE 支持）**

始终在测试方法上声明显式可见性（`public`、`protected`、`private`）和返回类型。测试方法必须是 `public` 且返回 `void`。辅助方法应该是 `private`，除非通过 trait 共享。属性应有类型声明。

这使测试类的契约明确，并使 PHPStan 和 Psalm 等静态分析工具能够捕获错误。

**错误（缺少可见性、类型、返回类型）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\UserService;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class UserServiceTest extends TestCase
{
    private $service;

    protected function setUp(): void
    {
        $this->service = new UserService();
    }

    #[Test]
    function it_creates_user()
    {
        $user = $this->service->create('John');

        $this->assertSame('John', $user->getName());
    }

    function buildUser($name)
    {
        return $this->service->create($name);
    }
}
```

**正确（显式可见性和类型）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\User;
use App\UserService;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class UserServiceTest extends TestCase
{
    private UserService $service;

    protected function setUp(): void
    {
        $this->service = new UserService();
    }

    #[Test]
    public function it_creates_user(): void
    {
        $user = $this->service->create('John');

        $this->assertSame('John', $user->getName());
    }

    private function buildUser(string $name): User
    {
        return $this->service->create($name);
    }
}
```
