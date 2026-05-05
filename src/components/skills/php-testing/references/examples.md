# PHP 测试 — 代码示例

## PHPUnit: AAA 结构锁定单个行为

```php
<?php

declare(strict_types=1);

namespace Tests\Unit\Pricing;

use App\Pricing\Money;
use App\Pricing\PriceFormatter;
use PHPUnit\Framework\TestCase;

final class PriceFormatterTest extends TestCase
{
    public function testFormatsMoneyForCheckoutSummary(): void
    {
        $formatter = new PriceFormatter();
        $money = new Money(1099, 'CNY');

        $result = $formatter->format($money);

        $this->assertSame('CNY 10.99', $result);
    }
}
```

## PHPUnit: 属性和数据提供者

```php
<?php

declare(strict_types=1);

namespace Tests\Unit\Validation;

use App\Validation\EmailValidator;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class EmailValidatorTest extends TestCase
{
    #[Test]
    #[DataProvider('validEmails')]
    public function accepts_valid_email_addresses(string $email): void
    {
        $validator = new EmailValidator();

        $this->assertTrue($validator->isValid($email));
    }

    /**
     * @return list<array{0: string}>
     */
    public static function validEmails(): array
    {
        return [
            ['user@example.com'],
            ['john.doe@company.co.uk'],
            ['dev+filter@domain.org'],
        ];
    }
}
```

## PHPUnit: 只 Mock 外部协作者

```php
<?php

declare(strict_types=1);

namespace Tests\Unit\Order;

use App\Notification\MailerInterface;
use App\Order\Order;
use App\Order\OrderNotifier;
use PHPUnit\Framework\MockObject\MockObject;
use PHPUnit\Framework\TestCase;

final class OrderNotifierTest extends TestCase
{
    private MailerInterface&MockObject $mailer;
    private OrderNotifier $notifier;

    protected function setUp(): void
    {
        parent::setUp();
        $this->mailer = $this->createMock(MailerInterface::class);
        $this->notifier = new OrderNotifier($this->mailer);
    }

    public function testSendsConfirmationEmailForPlacedOrder(): void
    {
        $order = new Order('SO-1001', 'buyer@example.com');

        $this->mailer
            ->expects($this->once())
            ->method('send')
            ->with('buyer@example.com', 'SO-1001');

        $this->notifier->sendConfirmation($order);
    }
}
```

## Pest: 现代替代写法

```php
<?php

declare(strict_types=1);

use App\Models\User;
use App\Services\UserService;

beforeEach(function () {
    $this->userService = app(UserService::class);
});

it('creates a user successfully', function () {
    $user = $this->userService->createUser(
        email: 'test@example.com',
        password: 'SecurePass123!',
    );

    expect($user)
        ->toBeInstanceOf(User::class)
        ->email->toBe('test@example.com');
});

it('rejects duplicate emails', function () {
    $this->userService->createUser(email: 'dup@example.com', password: 'Pass123!');

    $this->userService->createUser(email: 'dup@example.com', password: 'Pass456!');
})->throws(DuplicateEmailException::class);
```
