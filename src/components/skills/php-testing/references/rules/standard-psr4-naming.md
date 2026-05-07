---
title: PSR-4 文件和命名空间约定
impact: HIGH
impactDescription: 一致的自动加载和文件发现
tags: standards, psr-4, namespace, autoloading, naming
---

## PSR-4 文件和命名空间约定

**影响：高（一致的自动加载和文件发现）**

在测试目录中镜像生产代码的命名空间结构。如果生产类是 `App\Service\OrderProcessor`，测试类应该是 `App\Tests\Service\OrderProcessorTest`。文件应位于 `tests/Service/OrderProcessorTest.php`。

此约定使得为任何类找到对应测试（以及反向查找）变得非常简单。

**错误（扁平测试目录，无镜像）：**

```php
<?php

declare(strict_types=1);

// 文件：tests/OrderProcessorTest.php
namespace App\Tests;

// 生产类在 App\Service\OrderProcessor
// 但测试没有镜像命名空间结构
```

**正确（镜像生产命名空间）：**

```php
<?php

declare(strict_types=1);

// 文件：tests/Service/OrderProcessorTest.php
namespace App\Tests\Service;

use App\Service\OrderProcessor;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

#[CoversClass(OrderProcessor::class)]
final class OrderProcessorTest extends TestCase
{
    #[Test]
    public function it_processes_valid_order(): void
    {
        // ...
    }
}
```

在 `composer.json` 中配置：

```json
{
    "autoload-dev": {
        "psr-4": {
            "App\\Tests\\": "tests/"
        }
    }
}
```
