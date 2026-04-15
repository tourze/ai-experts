---
title: "#[TestWith] 内联数据集"
impact: MEDIUM
impactDescription: 简单场景的紧凑内联数据
tags: data, test-with, inline, compact
---

## #[TestWith] 内联数据集

**影响：中（简单场景的紧凑内联数据）**

对于不需要单独数据提供者方法的小型简单数据集，使用 `#[TestWith]`。数据直接作为属性声明在测试方法上，保持测试自包含。

最适合 2-4 个简单场景。对于更复杂或更多的数据集，优先使用 `#[DataProvider]`。

**错误（为简单数据创建单独的提供者）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\MathHelper;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class MathHelperTest extends TestCase
{
    #[Test]
    #[DataProvider('absoluteValueProvider')]
    public function it_returns_absolute_value(int $input, int $expected): void
    {
        $this->assertSame($expected, MathHelper::abs($input));
    }

    public static function absoluteValueProvider(): array
    {
        return [
            [5, 5],
            [-3, 3],
            [0, 0],
        ];
    }
}
```

**正确（使用 #[TestWith] 内联数据）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\MathHelper;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\Attributes\TestWith;
use PHPUnit\Framework\TestCase;

final class MathHelperTest extends TestCase
{
    #[Test]
    #[TestWith([5, 5])]
    #[TestWith([-3, 3])]
    #[TestWith([0, 0])]
    public function it_returns_absolute_value(int $input, int $expected): void
    {
        $this->assertSame($expected, MathHelper::abs($input));
    }
}
```

参考：[PHPUnit TestWith](https://docs.phpunit.de/en/11.5/attributes.html#testwith)
