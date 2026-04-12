# 测试与质量保障

## 带严格类型的 PHPUnit

```php
<?php

declare(strict_types=1);

namespace Tests\Unit\Service;

use App\Repository\UserRepositoryInterface;
use App\Service\UserService;
use App\Service\EmailService;
use PHPUnit\Framework\TestCase;
use PHPUnit\Framework\MockObject\MockObject;

final class UserServiceTest extends TestCase
{
    private UserRepositoryInterface&MockObject $userRepository;
    private EmailService&MockObject $emailService;
    private UserService $userService;

    protected function setUp(): void
    {
        $this->userRepository = $this->createMock(UserRepositoryInterface::class);
        $this->emailService = $this->createMock(EmailService::class);
        $this->userService = new UserService($this->userRepository, $this->emailService);
    }

    public function testCreateUserSuccessfully(): void
    {
        $this->userRepository->expects($this->once())->method('findByEmail')->willReturn(null);
        $this->userRepository->expects($this->once())->method('create')
            ->willReturn($this->createUser('test@example.com'));
        $this->emailService->expects($this->once())->method('sendWelcomeEmail');

        $user = $this->userService->createUser('test@example.com', 'SecurePass123!');
        $this->assertSame('test@example.com', $user->email);
    }
}
```

## 数据提供者

```php
<?php

declare(strict_types=1);

namespace Tests\Unit\Validator;

use App\Validator\EmailValidator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class EmailValidatorTest extends TestCase
{
    #[Test]
    #[DataProvider('validEmailProvider')]
    public function itValidatesCorrectEmails(string $email): void
    {
        $this->assertTrue((new EmailValidator())->isValid($email));
    }

    public static function validEmailProvider(): array
    {
        return [['user@example.com'], ['john.doe@company.co.uk'], ['test+filter@domain.org']];
    }
}
```

## Pest 测试（现代替代方案）

```php
<?php

declare(strict_types=1);

use App\Models\User;
use App\Services\UserService;

beforeEach(function () {
    $this->userService = app(UserService::class);
});

it('creates a user successfully', function () {
    $user = $this->userService->createUser(email: 'test@example.com', password: 'SecurePass123!');
    expect($user)->toBeInstanceOf(User::class)->email->toBe('test@example.com');
});
```

## PHPStan 配置

```neon
# phpstan.neon
parameters:
    level: 9
    paths: [src, tests]
    excludePaths: [src/bootstrap.php, vendor]
    checkMissingIterableValueType: true
    checkGenericClassInNonGenericObjectType: true
    reportUnmatchedIgnoredErrors: true
    type_coverage:
        return_type: 100
        param_type: 100
        property_type: 100
includes:
    - vendor/phpstan/phpstan-strict-rules/rules.neon
```

## 代码覆盖率

```xml
<!-- phpunit.xml -->
<?xml version="1.0" encoding="UTF-8"?>
<phpunit bootstrap="vendor/autoload.php" colors="true" failOnRisky="true" failOnWarning="true">
    <testsuites>
        <testsuite name="Unit"><directory>tests/Unit</directory></testsuite>
        <testsuite name="Feature"><directory>tests/Feature</directory></testsuite>
    </testsuites>
    <coverage>
        <include><directory suffix=".php">src</directory></include>
    </coverage>
</phpunit>
```

## 快速参考

| 工具 | 用途 | 命令 |
|------|------|------|
| PHPUnit | 单元/功能测试 | `./vendor/bin/phpunit` |
| Pest | 现代测试 | `./vendor/bin/pest` |
| PHPStan | 静态分析 | `./vendor/bin/phpstan analyse` |
| Psalm | 替代静态分析 | `./vendor/bin/psalm` |
| PHP-CS-Fixer | 代码风格 | `./vendor/bin/php-cs-fixer fix` |

| 断言 | PHPUnit | Pest |
|------|---------|------|
| 相等 | `$this->assertSame()` | `expect()->toBe()` |
| 类型 | `$this->assertInstanceOf()` | `expect()->toBeInstanceOf()` |
| 异常 | `$this->expectException()` | `expect()->toThrow()` |
