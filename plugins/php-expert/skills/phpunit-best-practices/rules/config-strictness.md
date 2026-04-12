---
title: 启用严格模式设置
impact: MEDIUM
impactDescription: 自动捕获测试质量问题
tags: configuration, strict, risky, baseline
---

## 启用严格模式设置

**影响：中（自动捕获测试质量问题）**

在 `phpunit.xml` 中启用严格模式设置以捕获常见的测试质量问题。关键设置：`failOnRisky` 标记无断言的测试，`failOnWarning` 将警告视为失败，`beStrictAboutTestsThatDoNotTestAnything` 捕获空测试。

这些设置强制纪律，防止"绿色"测试套件实际上什么都没测试。

**错误（宽松的默认设置）：**

```xml
<!-- phpunit.xml -->
<phpunit>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

**正确（启用严格设置）：**

```xml
<!-- phpunit.xml -->
<phpunit
    failOnRisky="true"
    failOnWarning="true"
    beStrictAboutTestsThatDoNotTestAnything="true"
    beStrictAboutCoverageMetadata="true"
>
    <testsuites>
        <testsuite name="unit">
            <directory>tests</directory>
        </testsuite>
    </testsuites>
</phpunit>
```

启用严格模式后，以下测试会失败而非静默通过：

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class ExampleTest extends TestCase
{
    #[Test]
    public function it_does_nothing(): void
    {
        // 无断言——严格模式下标记为有风险
        $x = 1 + 1;
    }
}
```

参考：[PHPUnit Configuration](https://docs.phpunit.de/en/11.5/configuration.html)
