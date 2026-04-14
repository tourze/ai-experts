---
name: phpunit-best-practices
description: 当用户编写、审查或重构 PHPUnit 测试时使用。适用于测试结构、数据提供者、属性、Mock、集成测试与 phpunit.xml 配置收敛，目标是让测试可维护、可读、可重复并且能稳定反馈真实回归。
license: MIT
metadata:
  author: pentiminax
  version: "1.0.0"
---

# PHPUnit 最佳实践

## 适用场景

- 编写新的 PHPUnit 测试类、测试方法和测试夹具。
- 审查或重构已有测试，降低脆弱断言、过度 Mock 和复制粘贴。
- 统一 `#[Test]`、数据提供者、覆盖率边界与测试分组。
- 调整 `phpunit.xml` 的严格模式、套件划分和覆盖率策略。

## 核心约束

- 测试首先满足 FIRST：快速、隔离、可重复、自校验、及时编写。
- 每个测试只表达一个行为断言，用 AAA（Arrange / Act / Assert）组织结构。
- 测试文件与生产文件一样启用 `declare(strict_types=1)`，并保持显式类型。
- 优先使用 PHP 8 属性（`#[Test]`、`#[DataProvider]`、`#[CoversClass]`），不要回退到旧式注解。
- Mock 只隔离真正的外部协作者，不要 Mock 被测系统内部实现细节。
- 集成测试要明确边界、清理状态并避免“偶尔成功”的环境耦合。

## 代码模式

### 用 AAA 结构锁定单个行为

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

### 用属性和数据提供者表达多场景

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

### 只 Mock 外部协作者，不 Mock 被测对象内部实现

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

## 检查清单

- 优先检查原则类规则：
  - [AAA 结构](rules/principle-aaa-pattern.md)
  - [FIRST: 快速](rules/principle-first-fast.md)
  - [FIRST: 隔离](rules/principle-first-isolated.md)
  - [FIRST: 可重复](rules/principle-first-repeatable.md)
- 编码标准保持统一：
  - [strict_types](rules/standard-strict-types.md)
  - [测试类 final](rules/standard-final-classes.md)
  - [命名与类型提示](rules/standard-visibility-type-hints.md)
- 属性与数据集配置要准确：
  - [`#[Test]`](rules/attr-test-attribute.md)
  - [`#[CoversClass]`](rules/attr-covers-class.md)
  - [`#[DataProvider]`](rules/data-provider.md)
  - [`#[DataProviderExternal]`](rules/data-provider-external.md)
- Mock 与集成测试边界要干净：
  - [避免过度 Mock](rules/mock-avoid-over-mocking.md)
  - [HTTP 冒烟测试](rules/integration-smoke-http.md)
  - [事务清理](rules/integration-transactions.md)
- 需要实现层约束或输入契约时，联动查看 [php-pro](../php-pro/SKILL.md) 与 [php-doc](../php-doc/SKILL.md)。

## 反模式

- 一个测试里同时验证多个行为，失败后无法定位根因。
- 继续使用 `@test`、`@dataProvider` 等旧式注解而不迁移到属性。
- 为了方便而直接复用共享可变状态，导致测试顺序依赖。
- Mock 被测对象内部私有实现，使重构变成“改测试而不是改代码”。
- 测试名只写 `test1`、`it_works`，看不出业务行为。
- phpunit.xml 关闭严格模式，默默吞掉 risky / warning / coverage 漏洞。
