---
title: "#[Group] 任意分类"
impact: MEDIUM
impactDescription: 灵活的测试过滤和组织
tags: attributes, group, categorization, filtering
---

## #[Group] 任意分类

**影响：中（灵活的测试过滤和组织）**

使用 `#[Group('name')]` 标记测试以进行选择性执行。分组允许通过 `--group` 和 `--exclude-group` CLI 选项按功能、层或任意类别运行测试子集。

常见分组名称：`slow`、`database`、`api`、`smoke`、`regression`。

**错误（无分组，必须运行所有测试）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class PaymentGatewayTest extends TestCase
{
    #[Test]
    public function it_charges_credit_card(): void
    {
        // 调用外部 API 的慢速测试
        // 无法从快速 CI 运行中排除
    }
}
```

**正确（使用 #[Group] 选择性执行）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\Attributes\Group;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

#[Group('external-api')]
final class PaymentGatewayTest extends TestCase
{
    #[Test]
    public function it_charges_credit_card(): void
    {
        // 现在可以运行：phpunit --exclude-group=external-api
        // 或专门运行：phpunit --group=external-api
    }
}
```

参考：[PHPUnit Groups](https://docs.phpunit.de/en/11.5/attributes.html#group)
