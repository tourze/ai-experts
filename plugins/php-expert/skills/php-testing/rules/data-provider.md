---
title: "#[DataProvider] 处理多场景"
impact: HIGH
impactDescription: 消除重复的测试方法
tags: data, provider, scenarios, parameterized
---

## #[DataProvider] 处理多场景

**影响：高（消除重复的测试方法）**

使用 `#[DataProvider('methodName')]` 对多组输入/输出数据运行相同的测试逻辑。数据提供者消除了仅数据不同的复制粘贴测试方法，便于添加新场景。

提供者方法必须是 `public static` 并返回可迭代的数组。使用描述性字符串键以获得可读的失败消息。

**错误（重复的测试方法）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Slugger;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class SluggerTest extends TestCase
{
    #[Test]
    public function it_slugifies_simple_string(): void
    {
        $this->assertSame('hello-world', Slugger::slugify('Hello World'));
    }

    #[Test]
    public function it_slugifies_string_with_special_chars(): void
    {
        $this->assertSame('cafe-creme', Slugger::slugify('Café Crème'));
    }

    #[Test]
    public function it_slugifies_empty_string(): void
    {
        $this->assertSame('', Slugger::slugify(''));
    }
}
```

**正确（数据提供者）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Slugger;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class SluggerTest extends TestCase
{
    #[Test]
    #[DataProvider('slugifyProvider')]
    public function it_slugifies_string(string $input, string $expected): void
    {
        $result = Slugger::slugify($input);

        $this->assertSame($expected, $result);
    }

    public static function slugifyProvider(): iterable
    {
        yield 'simple string' => ['Hello World', 'hello-world'];
        yield 'special characters' => ['Café Crème', 'cafe-creme'];
        yield 'empty string' => ['', ''];
        yield 'multiple spaces' => ['too   many   spaces', 'too-many-spaces'];
        yield 'already slugified' => ['hello-world', 'hello-world'];
    }
}
```

参考：[PHPUnit DataProvider](https://docs.phpunit.de/en/11.5/attributes.html#dataprovider)
