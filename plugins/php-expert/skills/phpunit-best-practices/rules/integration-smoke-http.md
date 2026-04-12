---
title: HTTP 控制器冒烟测试
impact: HIGH
impactDescription: 尽早发现路由和接线错误
tags: integration, smoke, http, controller, routing
---

## HTTP 控制器冒烟测试

**影响：高（尽早发现路由和接线错误）**

为每个 HTTP 端点编写冒烟测试，验证路由、控制器接线和基本响应状态码。这些测试不验证业务逻辑——它们捕获单元测试无法检测到的配置和接线错误。

冒烟测试应该快速（无数据库填充），仅测试端点是否以预期状态码响应。

**错误（无冒烟测试，仅有单元测试）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use App\Controller\HealthController;
use PHPUnit\Framework\Attributes\Test;
use PHPUnit\Framework\TestCase;

// 直接测试控制器方法——遗漏了路由和中间件
final class HealthControllerTest extends TestCase
{
    #[Test]
    public function it_returns_ok(): void
    {
        $controller = new HealthController();

        $response = $controller->index();

        $this->assertSame(200, $response->getStatusCode());
    }
}
```

**正确（使用框架测试客户端的 HTTP 冒烟测试）：**

```php
<?php

declare(strict_types=1);

namespace App\Tests\Controller;

use PHPUnit\Framework\Attributes\Test;
use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

final class HealthControllerTest extends WebTestCase
{
    #[Test]
    public function it_returns_200_for_health_check(): void
    {
        $client = static::createClient();

        $client->request('GET', '/health');

        $this->assertResponseIsSuccessful();
    }

    #[Test]
    public function it_returns_json_content_type(): void
    {
        $client = static::createClient();

        $client->request('GET', '/api/status');

        $this->assertResponseHeaderSame('Content-Type', 'application/json');
    }
}
```
