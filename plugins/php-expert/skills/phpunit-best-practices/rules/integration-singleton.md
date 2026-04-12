---
title: 无状态服务使用单例
impact: MEDIUM
impactDescription: 避免冗余的服务实例化
tags: integration, singleton, stateless, performance
---

## 无状态服务使用单例

**影响：中（避免冗余的服务实例化）**

当测试的无状态服务构造成本高昂时（例如加载配置、编译 Schema），在测试中使用单例模式避免每个测试方法都重新创建。

这仅适用于真正无状态、不可变的服务。如果服务持有可变状态，使用 `setUp()` 代替。

**错误（每个测试重新创建无状态服务）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\SchemaValidator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class SchemaValidatorTest extends TestCase
{
    #[Test]
    public function it_validates_correct_schema(): void
    {
        // 昂贵：每个测试都加载并编译 JSON Schema
        $validator = new SchemaValidator(__DIR__ . '/fixtures/schema.json');

        $this->assertTrue($validator->validate(['name' => 'John']));
    }

    #[Test]
    public function it_rejects_invalid_schema(): void
    {
        $validator = new SchemaValidator(__DIR__ . '/fixtures/schema.json');

        $this->assertFalse($validator->validate(['invalid' => true]));
    }
}
```

**正确（无状态服务使用单例）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\SchemaValidator;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class SchemaValidatorTest extends TestCase
{
    private static SchemaValidator $validator;

    public static function setUpBeforeClass(): void
    {
        self::$validator = new SchemaValidator(__DIR__ . '/fixtures/schema.json');
    }

    #[Test]
    public function it_validates_correct_schema(): void
    {
        $this->assertTrue(self::$validator->validate(['name' => 'John']));
    }

    #[Test]
    public function it_rejects_invalid_schema(): void
    {
        $this->assertFalse(self::$validator->validate(['invalid' => true]));
    }
}
```
