---
title: Prophecy 富表达力的测试替身
impact: MEDIUM
impactDescription: 可读的基于 Promise 的 Mock 语法
tags: mocking, prophecy, test-doubles, phpspec
---

## Prophecy 富表达力的测试替身

**影响：中（可读的基于 Promise 的 Mock 语法）**

考虑使用 Prophecy（通过 `phpspec/prophecy-phpunit`）作为 PHPUnit 内置 Mock 系统的替代方案。Prophecy 使用基于 Promise 的 API，读起来更自然："this method will return X"对比"method expects to be called and will return X"。

注意：Prophecy 是独立的包且可选。PHPUnit 内置的 `createMock()`/`createStub()` 是默认选择。当团队偏好其表达性语法时使用 Prophecy。

**错误（冗长的 PHPUnit Mock 配置用于行为验证）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Mailer;
use App\UserService;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class UserServiceTest extends TestCase
{
    #[Test]
    public function it_sends_welcome_email(): void
    {
        $mailer = $this->createMock(Mailer::class);
        $mailer->expects($this->once())
            ->method('send')
            ->with(
                $this->equalTo('john@example.com'),
                $this->equalTo('Welcome!'),
                $this->stringContains('Hello John')
            );

        $service = new UserService($mailer);

        $service->register('John', 'john@example.com');
    }
}
```

**正确（Prophecy 的表达性 Mock）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Mailer;
use App\UserService;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use Prophecy\Argument;
use Prophecy\PhpUnit\ProphecyTrait;

final class UserServiceTest extends TestCase
{
    use ProphecyTrait;

    #[Test]
    public function it_sends_welcome_email(): void
    {
        $mailer = $this->prophesize(Mailer::class);
        $mailer->send(
            'john@example.com',
            'Welcome!',
            Argument::containingString('Hello John'),
        )->shouldBeCalledOnce();

        $service = new UserService($mailer->reveal());

        $service->register('John', 'john@example.com');
    }
}
```

参考：[Prophecy PHPUnit](https://github.com/phpspec/prophecy-phpunit)
