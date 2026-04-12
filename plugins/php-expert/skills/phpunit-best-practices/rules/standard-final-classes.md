---
title: 将测试类标记为 Final
impact: HIGH
impactDescription: 防止脆弱的测试继承层次
tags: standards, final, inheritance, design
---

## 将测试类标记为 Final

**影响：高（防止脆弱的测试继承层次）**

将所有测试类标记为 `final`。测试继承会创建脆弱的层次结构，修改基础测试类可能会破坏数十个子类。每个测试类应该是自包含的。

如果需要共享准备代码，使用 trait 或组合代替从自定义基类继承。直接继承 `TestCase` 是唯一需要的继承。

**错误（可继承的测试类）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\TestCase;

class UserTest extends TestCase
{
    // 可以被继承，创建脆弱的继承链
}
```

**正确（final 测试类）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class UserTest extends TestCase
{
    #[Test]
    public function it_creates_user_with_name(): void
    {
        // ...
    }
}
```
