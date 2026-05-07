---
title: 可读的测试名称作为规格说明
impact: MEDIUM
impactDescription: 测试文档化预期行为
tags: documentation, naming, specifications, readable
---

## 可读的测试名称作为规格说明

**影响：中（测试文档化预期行为）**

将测试方法名写成行为规格说明。每个名称应描述特定行为，而非被调用的方法。思考"it does X when Y"而非"test method Z"。

良好的测试名称作为活文档，利益相关者可以阅读它们来理解系统行为。

**错误（以方法为中心的命名）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\UserRegistration;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class UserRegistrationTest extends TestCase
{
    #[Test]
    public function it_test_register(): void { /* ... */ }

    #[Test]
    public function it_test_validate(): void { /* ... */ }

    #[Test]
    public function it_test_email(): void { /* ... */ }
}
```

**正确（以行为为中心的命名）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\UserRegistration;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class UserRegistrationTest extends TestCase
{
    #[Test]
    public function it_registers_user_with_valid_credentials(): void { /* ... */ }

    #[Test]
    public function it_rejects_registration_with_duplicate_email(): void { /* ... */ }

    #[Test]
    public function it_sends_confirmation_email_after_registration(): void { /* ... */ }

    #[Test]
    public function it_hashes_password_before_storing(): void { /* ... */ }
}
```

TestDox 输出读起来像规格说明：
```
User Registration
 ✔ It registers user with valid credentials
 ✔ It rejects registration with duplicate email
 ✔ It sends confirmation email after registration
 ✔ It hashes password before storing
```
