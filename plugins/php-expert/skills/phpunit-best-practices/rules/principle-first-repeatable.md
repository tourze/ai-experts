---
title: 可重复测试
impact: HIGH
impactDescription: 无论何时何地，每次运行结果相同
tags: testing, first, repeatable, deterministic, reproducible
---

## 可重复测试

**影响：高（无论何时何地，每次运行结果相同）**

FIRST 原则中的"R"代表 Repeatable（可重复）。无论何时、何地、运行多少次，测试都必须产生相同的结果。避免依赖当前时间、随机值、网络可用性或特定环境配置。

注入时钟、随机数生成器和外部依赖，使其在测试中可控。

**错误（依赖当前时间）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Subscription;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class SubscriptionTest extends TestCase
{
    #[Test]
    public function it_checks_if_subscription_is_expired(): void
    {
        $subscription = new Subscription(
            expiresAt: new \DateTimeImmutable('+1 day'),
        );

        // 如果恰好在午夜边界运行，此测试会失败
        $this->assertFalse($subscription->isExpired());
    }
}
```

**正确（注入确定性的时钟）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Subscription;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;
use Psr\Clock\ClockInterface;

final class SubscriptionTest extends TestCase
{
    #[Test]
    public function it_checks_if_subscription_is_expired(): void
    {
        $now = new \DateTimeImmutable('2025-06-15 10:00:00');
        $clock = $this->createStub(ClockInterface::class);
        $clock->method('now')->willReturn($now);
        $subscription = new Subscription(
            expiresAt: new \DateTimeImmutable('2025-06-16 10:00:00'),
            clock: $clock,
        );

        $result = $subscription->isExpired();

        $this->assertFalse($result);
    }
}
```
