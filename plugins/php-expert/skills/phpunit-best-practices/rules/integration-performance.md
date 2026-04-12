---
title: 性能感知的测试准备
impact: MEDIUM
impactDescription: 减少测试套件执行时间
tags: integration, performance, setup, teardown, speed
---

## 性能感知的测试准备

**影响：中（减少测试套件执行时间）**

最小化 `setUp()` 中的昂贵操作。如果资源可以在类的所有测试方法间安全共享，使用 `setUpBeforeClass()` 进行一次性初始化。将 `setUp()` 保留给必须每次刷新的状态。

注意：`setUpBeforeClass()` 中的共享状态仅对不可变或只读资源安全。

**错误（每个测试重复昂贵的准备）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Config;
use App\ConfigLoader;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class ConfigTest extends TestCase
{
    private Config $config;

    protected function setUp(): void
    {
        // 每个测试都解析大型 YAML 文件
        $this->config = ConfigLoader::fromFile(__DIR__ . '/fixtures/config.yaml');
    }

    #[Test]
    public function it_reads_database_host(): void
    {
        $this->assertSame('localhost', $this->config->get('database.host'));
    }

    #[Test]
    public function it_reads_app_name(): void
    {
        $this->assertSame('MyApp', $this->config->get('app.name'));
    }
}
```

**正确（只读资源一次性准备）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests;

use App\Config;
use App\ConfigLoader;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

final class ConfigTest extends TestCase
{
    private static Config $config;

    public static function setUpBeforeClass(): void
    {
        // 解析一次，所有测试共享（Config 是不可变的）
        self::$config = ConfigLoader::fromFile(__DIR__ . '/fixtures/config.yaml');
    }

    #[Test]
    public function it_reads_database_host(): void
    {
        $this->assertSame('localhost', self::$config->get('database.host'));
    }

    #[Test]
    public function it_reads_app_name(): void
    {
        $this->assertSame('MyApp', self::$config->get('app.name'));
    }
}
```
