---
title: "#[DataProviderExternal] 共享数据"
impact: MEDIUM
impactDescription: 跨测试类复用数据提供者
tags: data, provider-external, shared, reuse
---

## #[DataProviderExternal] 共享数据

**影响：中（跨测试类复用数据提供者）**

使用 `#[DataProviderExternal(ClassName::class, 'methodName')]` 在测试类之间共享数据提供者。当多个测试类需要相同的输入数据（如验证规则或 fixture 数据集）时非常有用。

将共享提供者提取到专用的提供者类中以避免重复。

**错误（多个测试类中重复的提供者）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class EmailValidatorTest extends TestCase
{
    #[Test]
    #[DataProvider('invalidEmails')]
    public function it_rejects_invalid_email(string $email): void
    {
        // ...
    }

    public static function invalidEmails(): iterable
    {
        yield 'no at sign' => ['invalid'];
        yield 'no domain' => ['user@'];
        yield 'no local part' => ['@domain.com'];
    }
}

// 相同的数据在另一个测试类中重复...
```

**正确（外部数据提供者）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests\DataProvider;

final class EmailDataProvider
{
    public static function invalidEmails(): iterable
    {
        yield 'no at sign' => ['invalid'];
        yield 'no domain' => ['user@'];
        yield 'no local part' => ['@domain.com'];
        yield 'double at' => ['user@@domain.com'];
    }

    public static function validEmails(): iterable
    {
        yield 'standard' => ['user@example.com'];
        yield 'subdomain' => ['user@mail.example.com'];
        yield 'plus addressing' => ['user+tag@example.com'];
    }
}
```

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Tests\DataProvider\EmailDataProvider;
use App\EmailValidator;
use PHPUnit\Framework\Attributes\DataProviderExternal;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class EmailValidatorTest extends TestCase
{
    #[Test]
    #[DataProviderExternal(EmailDataProvider::class, 'invalidEmails')]
    public function it_rejects_invalid_email(string $email): void
    {
        $validator = new EmailValidator();

        $this->assertFalse($validator->isValid($email));
    }
}
```

参考：[PHPUnit DataProviderExternal](https://docs.phpunit.de/en/11.5/attributes.html#dataproviderexternal)
